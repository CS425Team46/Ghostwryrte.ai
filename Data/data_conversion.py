import firebase_admin
from firebase_admin import credentials, firestore
import json
import openai
from openai import OpenAI
import os
import argparse

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
parser = argparse.ArgumentParser(description='Convert user data to training format.')
parser.add_argument('user_id', help='Firebase User ID')
parser.add_argument('session_id', help='Session ID')
args = parser.parse_args()

user_id = args.user_id
session_id = args.session_id
# print(f'UID: {user_id}')
# user_id = "lQvmWjID8DPO0vHn3elqoKsxpQJ3"

def format_training_data_for_fine_tuning(user_id, session_id):
    user_files_ref = db.collection('users').document(user_id).collection(f'files_{session_id}')
    docs = user_files_ref.stream()
    training_data = []

    for doc in docs:
        file_data = doc.to_dict()
        title = file_data['Title']
        content = file_data['Content']
        # Format according to OpenAI's fine-tuning requirements
        formatted_data = {
            "messages": [
                {"role": "user", "content": title},
                {"role": "assistant", "content": content}
            ]
        }
        training_data.append(formatted_data)

    return training_data

def save_training_data_to_file(user_id, session_id):
    formatted_data = format_training_data_for_fine_tuning(user_id, session_id)
    file_name = f'training_data_{session_id}.jsonl'
    with open(file_name, 'w') as outfile:
        for item in formatted_data:
            json.dump(item, outfile)
            outfile.write('\n')  # Write a new line for each JSON object

def upload_to_openai_if_enough_entries(file_path, min_entries=10):
    # Count the number of entries in the JSONL file
    with open(file_path, 'r') as file:
        entries = file.readlines()

    # Check if there are at least min_entries
    if len(entries) >= min_entries:
        # Upload the file to OpenAI for fine-tuning
        response = client.files.create(
            file=open(file_path, "rb"),
            purpose="fine-tune"
        )
        file_id = response.id
        print(f'File uploaded successfully.')
        return file_id
    else:
        print(f'Not enough entries for fine-tuning. Found {len(entries)}, required {min_entries}.')

def store_file_id_in_firebase(user_id, file_id):
    user_ref = db.collection('users').document(user_id)
    user_ref.update({"latest_file_id": file_id})

if __name__ == '__main__':
    # Command line argument parsing
    parser = argparse.ArgumentParser(description='Convert user data to training format.')
    parser.add_argument('user_id', help='Firebase User ID')
    parser.add_argument('session_id', help='Session ID')
    args = parser.parse_args()

    user_id = args.user_id
    session_id = args.session_id

    print(f'UID: {user_id}')
    print(f'session_id: {session_id}')

    # user_id = "lQvmWjID8DPO0vHn3elqoKsxpQJ3"
    save_training_data_to_file(user_id, session_id)

    training_data_file = f'training_data_{session_id}.jsonl'  # Correct formatting

    # upload_to_openai_if_enough_entries(training_data_file)
    file_id = upload_to_openai_if_enough_entries(training_data_file)

    if file_id:
        store_file_id_in_firebase(user_id, file_id)
    else:
        print("Failed to add")