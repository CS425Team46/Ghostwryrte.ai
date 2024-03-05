import firebase_admin
from firebase_admin import firestore, credentials, firestore
import openai
from openai import OpenAI

client = OpenAI()
# Initialize Firebase Admin
cred = credentials.Certificate("ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

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
    test_user_id = 'lQvmWjID8DPO0vHn3elqoKsxpQJ3'
    result = start_model_training(test_user_id)
    print(result)