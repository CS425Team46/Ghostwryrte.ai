import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Firebase Admin
cred = credentials.Certificate("ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def format_training_data_for_fine_tuning(user_id):
    user_files_ref = db.collection('users').document(user_id).collection('files')
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

def save_training_data_to_file(user_id):
    formatted_data = format_training_data_for_fine_tuning(user_id)
    file_name = f'training_data_{user_id}.jsonl'
    with open(file_name, 'w') as outfile:
        for item in formatted_data:
            json.dump(item, outfile)
            outfile.write('\n')  # Write a new line for each JSON object

if __name__ == '__main__':
    user_id = 'EPG9YXfVGFUR1OqekhAZYi4dPl03'  # Replace with the currently signed in user ID
    save_training_data_to_file(user_id)