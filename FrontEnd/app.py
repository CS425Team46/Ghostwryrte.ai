import json
from flask import Flask, jsonify, render_template, request, redirect
import openai
from openai import OpenAI
import os
import subprocess
# from model_training import start_model_training


import firebase_admin
from firebase_admin import credentials, firestore, auth

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

# Initialize Firestore
db = firestore.client()

client = OpenAI()

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('AccountCreation.html')

@app.route('/content-generation')
def content_generation():
    return render_template('ContentGeneration.html')

@app.route('/ai-training')
def ai_training():
    return render_template('AITraining.html')

@app.route('/styling-and-format')
def styling_and_format():
    return render_template('StylingAndFormat.html')



@app.route('/generate-content', methods=['POST'])
def generate_content():
    # Fetch the data from form fields
    user_id = request.form.get('user_id')  # Adjust according to how you plan to send user_id
    user_prompt = request.form.get('user_prompt')

    # Handle cases where data is missing
    if not user_id or not user_prompt:
        return jsonify({'message': 'Missing user ID or prompt'}), 400

    # Proceed as previously described
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        model_id = user_data.get('model_id')
        if not model_id:
            return jsonify({'message': 'Model ID not found for user'}), 400
    else:
        return jsonify({'message': 'User not found'}), 404
    
    print(model_id)

    response = client.chat.completions.create(
        model=model_id,  # Use the fetched model_id
        messages=[{"role": "user", "content": user_prompt}]
    )
    message_content = response.choices[0].message.content.strip()
    return render_template('ContentGeneration.html', ai_response=message_content)


@app.route('/account-creation')
def account_creation():
    return render_template('AccountCreation.html')

@app.route('/run-data-conversion', methods=['POST'])
def run_data_conversion():
    data = request.json
    user_id = data.get('user_id')
    session_id = data.get('session_id')

    if not user_id or not session_id:
        return jsonify({'message': 'No user ID or session ID provided'}), 400

    result = subprocess.run(['python3', 'Data/data_conversion.py', user_id, session_id], capture_output=True, text=True)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)

    if result.returncode == 0:
        return jsonify({'message': 'Data conversion script executed successfully'})
    else:
        return jsonify({'message': f'Data conversion script failed: {result.stderr}'}), 500
    
    
@app.route('/start-model-training', methods=['POST'])
def start_model_training():
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({'message': 'No user ID provided'}), 400
    
    result = subprocess.run(['python3', 'Data/model_training.py', user_id], capture_output=True, text=True)
    print("STDERR from model training:", result.stderr)

    if result.returncode == 0:
        try:
            # Attempt to parse the stdout as JSON
            output = json.loads(result.stdout)
            return jsonify(output), 200
        except json.JSONDecodeError:
            # If stdout is not valid JSON, return the raw output for debugging
            return jsonify({'message': 'Non-JSON output received', 'output': result.stdout}), 500
    else:
        return jsonify({'message': 'Model training script failed', 'output': result.stderr}), 500




if __name__ == '__main__':
    app.run(debug=True)
