import json
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="urllib3 v2 only supports OpenSSL 1.1.1+")
import sys
import time
import logging

import firebase_admin
from firebase_admin import firestore, credentials, firestore
import openai
from openai import OpenAI
import argparse
import json


import os

client = OpenAI()
# Initialize Firebase Admin
# firebase_creds = json.loads(os.environ.get('FIREBASE_CREDENTIALS'))
# cred = credentials.Certificate("firebase_creds")
# firebase_admin.initialize_app(cred)

firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
if firebase_creds:
    cred_dict = json.loads(firebase_creds)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
else:
    raise ValueError('The FIREBASE_CREDENTIALS environment variable is not set.')

db = firestore.client()

# Command line argument parsing
parser = argparse.ArgumentParser(description='Start model training for a user.')
parser.add_argument('user_id', help='Firebase User ID')
args = parser.parse_args()

user_id = args.user_id

logging.basicConfig(filename='finetuning_status.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')



# def start_model_training(user_id):

#     db = firestore.client()
#     user_ref = db.collection('users').document(user_id)
#     user_doc = user_ref.get()

#     if not user_doc.exists:
#         return {'message': 'User not found', 'error': True}
    
#     latest_file_id = user_doc.to_dict().get('latest_file_id')
#     if not latest_file_id:
#         return {'message': 'Latest file ID not found for user', 'error': True}
    
#     try:
#         response = client.fine_tuning.jobs.create(
#         training_file=latest_file_id, 
#         model="gpt-3.5-turbo", 
#         hyperparameters={
#             "n_epochs": 15,
#             "batch_size": 5,
#             "learning_rate_multiplier": 0.1
#         }
#         )

#         user_ref = db.collection('users').document(user_id)
#         user_ref.update({"job_id": response.id})

#         return {'message': 'Model training started successfully', 'job_id': response.id}
#     except Exception as e:
#         return {'message': f'Failed to start model training: {str(e)}', 'error': True}

def start_model_training(user_id):
    db = firestore.client()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return {'message': 'User not found', 'error': True}
    
    user_data = user_doc.to_dict()
    latest_file_id = user_data.get('latest_file_id')
    existing_model_id = user_data.get('model_id')  # Get existing model_id if available

    if not latest_file_id:
        return {'message': 'Latest file ID not found for user', 'error': True}
    
    # Determine the base model for training
    base_model = existing_model_id if existing_model_id else "gpt-3.5-turbo"

    try:
        response = client.fine_tuning.jobs.create(
            training_file=latest_file_id, 
            model=base_model,  # Use existing model_id as base model if available
            hyperparameters={
                "n_epochs": 15,
                "batch_size": 5,
                "learning_rate_multiplier": 0.1
            }
        )

        user_ref.update({"job_id": response.id})

        return {'message': 'Model training finished successfully', 'job_id': response.id}
    except Exception as e:
        return {'message': f'Failed to start model training: {str(e)}', 'error': True}



def check_finetuning_job_status(job_id, user_id):  # Add user_id parameter
    while True:
        job_status = client.fine_tuning.jobs.retrieve(job_id)
        logging.info(f"Checking status of job {job_id}: {job_status.status}")

        if job_status.status == 'succeeded':
            model_id = job_status.fine_tuned_model  
            logging.info(f"Job {job_id} completed successfully. Model ID: {model_id}")
            # Update the Firestore with the model_id
            user_ref = db.collection('users').document(user_id)
            user_ref.update({"model_id": model_id})
            logging.info(f"Updated Firestore with model ID {model_id} for user {user_id}")
            return {'message': 'Model training completed successfully', 'model_id': model_id}
        elif job_status.status == 'failed':
            logging.error(f"Job {job_id} failed.")
            return {'message': 'Model training failed'}

        # Wait before checking the status again
        time.sleep(5) 


if __name__ == '__main__':
    # Get user ID from command line argument
    parser = argparse.ArgumentParser(description='Start model training for a user.')
    parser.add_argument('user_id', help='Firebase User ID')
    args = parser.parse_args()

    user_id = args.user_id
    result = start_model_training(user_id)

    if 'job_id' in result:
        status = check_finetuning_job_status(result['job_id'], user_id)  
        print(json.dumps(result))  
    else:
        print(json.dumps({'message': 'No job ID found to check status.'}))
