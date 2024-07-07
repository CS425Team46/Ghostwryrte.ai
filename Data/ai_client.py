import json
import sys
import time
import logging

from Data.database import DataBase
from openai import OpenAI


class AI_Client:

    client: OpenAI

    db: DataBase

    def __init__(self, api_key: str, db: DataBase):

        # create open ai API client
        self.client = OpenAI(api_key=api_key)

        # store the database instance in this object
        self.db = db
        
        # set up logging
        logging.basicConfig(
            filename="finetuning_status.log",
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
        )



    def delete_model(self, model_id: str):
        self.client.models.delete(model_id) # TODO: figure out how to check that this succeeded

# taken from model_training.py
########################################################################
    def model_training(self, user_id) -> bool:

        result = self.start_model_training(user_id)

        if 'job_id' in result:
            print("About to check fine-tuning job status")  
            status = self.check_finetuning_status(result['job_id'], user_id)  
            print("Status:", status)
            print(json.dumps(result)) 
            return True
        else:
            print("No job ID found to check status.")
            return False



    def start_model_training(self, user_id):

        latest_file_id = self.db.get_from_user_doc(user_id, 'latest_file_id')

        if not latest_file_id:
            return {'message': 'Latest file ID not found for user', 'error': True}
    
        try:
            response = self.client.fine_tuning.jobs.create(
                training_file=latest_file_id,
                model=self.db.get_from_user_doc(user_id, "model_id", default="gpt-3.5-turbo"), # type: ignore
                hyperparameters={
                    "n_epochs": 15,
                    "batch_size": 5,
                    "learning_rate_multiplier": 0.1
                }
            )

            self.db.update_data(user_id, "job_id", response.id)

            return {'message': 'Model training started successfully', 'job_id': response.id}
        except Exception as e:
            return {'message': f'Failed to start model training: {str(e)}', 'error': True}



    def check_finetuning_status(self, job_id, user_id):

        while True:
            job_status = self.client.fine_tuning.jobs.retrieve(job_id)
            logging.info(f"Checking status of job {job_id}: {job_status.status}")

            if job_status == 'succeeded':
                model_id = job_status.fine_tuned_model
                logging.info(f"Job {job_id} completed successfully. Model ID: {model_id}")

                # update database with model id
                self.db.update_data(user_id, "model_id", model_id) # type: ignore
                logging.info(f"Updated Firestore with model ID {model_id} for user {user_id}")

                return {'message': 'Model training completed successfully', 'model_id': model_id}

            elif job_status.status == 'failed':
                logging.error(f"Job {job_id} failed")
                return {'message': 'Model training failed'}

            else:
                # wait before checking status again
                time.sleep(5)




# taken from data_conversion.py
########################################################################
    def data_conversion(self, user_id: str, session_id: str) -> None:
        print(f"UID: {user_id}")
        print(f'session_id: {session_id}')

        self.save_training_data_to_file(user_id, session_id)

        training_data_file = 'training_data.jsonl'  # Update with actual file path

        file_id = self.upload_to_openai(training_data_file)

        if file_id:
            self.db.update_data(user_id, "latest_file_id", file_id)
        else:
            print("Failed to add")
        

    def format_training_data_for_fine_tuning(self, user_id: str, session_id: str) -> list[list[dict]]:

        docs = self.db.get_training_data(user_id, session_id)

        training_data = []
        
        # function to sanitize text by removing non-ASCII characters
        def sanitize_text(input_text):
            # Specifically target the \u2028 character along with general ASCII sanitization
            sanitized_text = input_text.replace('\u2028', ' ')  # Targeting \u2028 specifically
            sanitized_text = sanitized_text.encode('ascii', 'ignore').decode('ascii')  # Removing any non-ASCII characters
            return sanitized_text

        for doc in docs:
            file_data = doc.to_dict()
        
            # sanitize the title and content
            title = sanitize_text(file_data['Title'])
            content = sanitize_text(file_data['Content'])
            
            # format data so it can be parsed by OpenAI API
            formatted_data = {
                "messages": [
                    {"role": "user", "content": title},
                    {"role": "assistant", "content": content},
                ]
            }

            training_data.append(formatted_data)

        return training_data

    def save_training_data_to_file(self, user_id: str, session_id: str) -> None:

        formatted_data = self.format_training_data_for_fine_tuning(user_id, session_id)

        file_name = f"training_data.jsonl"

        with open(file_name, "w") as outfile:
            for item in formatted_data:
                json.dump(item, outfile)
                outfile.write("\n")

    def upload_to_openai(self, file_path, min_entries=10) -> str:
        # count entries in json file
        entries = open(file_path, "r").readlines()

        # check if there are at least min entries
        if len(entries) >= min_entries:
            # upload file to openai
            response = self.client.files.create(
                file=open(file_path, "rb"),
                purpose="fine-tune"
            )

            print("File uploaded successfully")
            return response.id

        else:
            print(f"Not enough entries for fine-tuning. Found {len(entries)}, required {min_entries}.")
            return None # type: ignore
