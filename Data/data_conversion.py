import firebase_admin
from firebase_admin import credentials, firestore
import json
import openai
from openai import OpenAI
import os
import argparse
import sys
import re

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

# def format_training_data_for_fine_tuning(user_id, session_id):
#     user_files_ref = db.collection('users').document(user_id).collection(f'files_{session_id}')
#     docs = user_files_ref.stream()
#     training_data = []

#     for doc in docs:
#         file_data = doc.to_dict()
#         print("file data: ", file_data)
#         title = file_data['Title']
#         content = file_data['Content']
#         # Format according to OpenAI's fine-tuning requirements
#         formatted_data = {
#             "messages": [
#                 {"role": "user", "content": title},
#                 {"role": "assistant", "content": content}
#             ]
#         }
#         training_data.append(formatted_data)

#     return training_data

def format_training_data_for_fine_tuning(user_id, session_id):
    user_files_ref = db.collection('users').document(user_id).collection(f'files_{session_id}')
    docs = user_files_ref.stream()
    training_data = []

    # Function to sanitize text by removing non-ASCII characters
    def sanitize_text(input_text):
        # Specifically target the \u2028 character along with general ASCII sanitization
        sanitized_text = input_text.replace('\u2028', ' ')  # Targeting \u2028 specifically
        sanitized_text = sanitized_text.encode('ascii', 'ignore').decode('ascii')  # Removing any non-ASCII characters
        return sanitized_text

    for doc in docs:
        file_data = doc.to_dict()
        
        # Sanitize the title and content
        title = sanitize_text(file_data['Title'])
        content = sanitize_text(file_data['Content'])
                
        # Format according to OpenAI's fine-tuning requirements
        formatted_data = {
            "messages": [
                {"role": "user", "content": title},
                {"role": "assistant", "content": content}
            ]
        }
        training_data.append(formatted_data)
        print("Success format_training_data_for_fine_tuning")

    return training_data


def save_training_data_to_file(user_id, session_id):
    formatted_data = format_training_data_for_fine_tuning(user_id, session_id)
    file_name = f'training_data_{session_id}.jsonl'
    with open(file_name, 'w', encoding='utf-8') as outfile:
        for item in formatted_data:
            json.dump(item, outfile, ensure_ascii=False)  # ensure_ascii=False to allow UTF-8 characters
            outfile.write('\n')  # Write a new line for each JSON object
    print("Success save_training_data_to_file")


def upload_to_openai_if_enough_entries(file_path, min_entries=10):
    # Count the number of entries in the JSONL file
    print("Starting upload_to_openai_if_enough_entries")
    with open(file_path, 'r', encoding='utf-8') as file:
        entries = file.readlines()

    # Check if there are at least min_entries
    if len(entries) >= min_entries:
        # Upload the file to OpenAI for fine-tuning
        response = client.files.create(
            file=open(file_path, "rb"),
            purpose="fine-tune"
        )
        file_id = response.id
        print("File ID: ", file_id)
        print(f'File uploaded successfully.')
        return file_id
    else:
        print(f'Not enough entries for fine-tuning. Found {len(entries)}, required {min_entries}.')

def store_file_id_in_firebase(user_id, file_id):
    user_ref = db.collection('users').document(user_id)
    user_ref.update({"latest_file_id": file_id})

def clean_string(s):
    # Removes backslashes and newline characters within a string
    # This will replace escaped newlines and reduce backslashes
    return s.replace('\\n', '').replace('\n', '').replace('\\', '')

def clean_json_values(data):
    if isinstance(data, dict):
        return {k: clean_json_values(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_json_values(v) for v in data]
    elif isinstance(data, str):
        return clean_string(data)
    else:
        return data

def clean_unicode_characters(file_path, output_file_path):
    with open(file_path, 'r', encoding='utf-8') as infile, \
         open(output_file_path, 'w', encoding='utf-8') as outfile:
        for line in infile:
            # Parse the JSON line
            data = json.loads(line)
            # Clean the data
            cleaned_data = clean_json_values(data)
            # Write the cleaned data back as a JSON line
            json.dump(cleaned_data, outfile, ensure_ascii=False)
            outfile.write('\n')

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

    output_file_path = f'cleaned_training_data_{session_id}.jsonl'
    clean_unicode_characters(training_data_file, output_file_path)

    # upload_to_openai_if_enough_entries(training_data_file)
    file_id = upload_to_openai_if_enough_entries(output_file_path)

    if file_id:
        store_file_id_in_firebase(user_id, file_id)
    else:
        print("Failed to add")