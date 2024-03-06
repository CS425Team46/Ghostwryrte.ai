import json
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="urllib3 v2 only supports OpenSSL 1.1.1+")

import firebase_admin
from firebase_admin import firestore, credentials, firestore
import openai
from openai import OpenAI
import argparse
import json

client = OpenAI()
# Initialize Firebase Admin
cred = credentials.Certificate("ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# Command line argument parsing
parser = argparse.ArgumentParser(description='Start model training for a user.')
parser.add_argument('user_id', help='Firebase User ID')
args = parser.parse_args()

user_id = args.user_id


def start_model_training(user_id):

    db = firestore.client()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return {'message': 'User not found', 'error': True}
    
    latest_file_id = user_doc.to_dict().get('latest_file_id')
    if not latest_file_id:
        return {'message': 'Latest file ID not found for user', 'error': True}
    
    try:
        response = client.fine_tuning.jobs.create(
        training_file=latest_file_id, 
        model="gpt-3.5-turbo", 
        hyperparameters={
            "n_epochs": 15,
            "batch_size": 5,
            "learning_rate_multiplier": 0.1
        }
        )
        return {'message': 'Model training started successfully', 'job_id': response.id}
    except Exception as e:
        return {'message': f'Failed to start model training: {str(e)}', 'error': True}


if __name__ == '__main__':
    # Get user ID from command line argument
    parser = argparse.ArgumentParser(description='Start model training for a user.')
    parser.add_argument('user_id', help='Firebase User ID')
    args = parser.parse_args()

    user_id = args.user_id
    result = start_model_training(user_id)
    print(json.dumps(result))  # Ensure this is the only print in this conditional There cant me warning messages.

