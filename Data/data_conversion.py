import json

from database import DataBase
from ai_client import AI_Client


class Data_Conversion:

    db: DataBase

    client: AI_Client

    def __init__(self, db: DataBase, client: AI_Client):

        self.db = db

        self.client = client

         

    # this should be called externally, nothing else
    def main(self, user_id: str, session_id: str) -> None:
        print(f"UID: {user_id}")
        print(f'session_id: {session_id}')

        self.save_training_data_to_file(user_id, session_id)

        training_data_file = 'training_data.jsonl'  # Update with actual file path

        file_id = self.client.upload_to_openai(training_data_file)

        if file_id:
            self.db.update_data(user_id, "latest_file_id", file_id)
        else:
            print("Failed to add")
        

    # formats training data optimally for fine-tuning
    def format_training_data_for_fine_tuning(self, user_id: str, session_id: str) -> list[list[dict]]:

        docs = self.db.get_training_data(user_id, session_id)

        training_data = []
        
        # function to sanitize text by removing non-ASCII characters
        def sanitize_text(input_text: str) -> str:
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

    # saves training data to a file
    def save_training_data_to_file(self, user_id: str, session_id: str) -> None:

        formatted_data = self.format_training_data_for_fine_tuning(user_id, session_id)

        file_name = f"training_data.jsonl"

        with open(file_name, "w") as outfile:
            for item in formatted_data:
                json.dump(item, outfile)
                outfile.write("\n")

        print("Successfully saved file")

    # removes backslashes and newline characters within a string
    def clean_string(self, string: str) -> str:
        # this will replace escaped newlines and reduce backslashes
        return string.replace('\\n', '').replace('\n', '').replace('\\', '')

    # recursively cleans values in json
    def clean_json_values(self, data: dict | list | str) -> dict | list | str:
        if isinstance(data, dict):
            return {k: self.clean_json_values(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.clean_json_values(v) for v in data]
        elif isinstance(data, str):
            return self.clean_string(data)
        else:
            return data

    # cleans data from a file and outputs it to a file
    def clean_unicode_characters(self, file_path: str, output_file_path: str) -> None:
        with open(file_path, 'r', encoding='utf-8') as infile, \
             open(output_file_path, 'w', encoding='utf-8') as outfile:
            for line in infile:
                # Parse the JSON line
                data = json.loads(line)
                # Clean the data
                cleaned_data = self.clean_json_values(data)
                # Write the cleaned data back as a JSON line
                json.dump(cleaned_data, outfile, ensure_ascii=False)
                outfile.write('\n')

