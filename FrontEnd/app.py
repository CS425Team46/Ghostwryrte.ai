from flask import Flask, jsonify, render_template, request, redirect
import openai
from openai import OpenAI
# import firebase_admin
# from firebase_admin import credentials, firestore, auth

# cred = credentials.Certificate("ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
# firebase_admin.initialize_app(cred)

# Initialize Firestore
# db = firestore.client()

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
    user_prompt = request.form['user_prompt']
    # Call AI model with the user_prompt
    response = client.chat.completions.create(
        model="ft:gpt-3.5-turbo-0613:personal::8pvGEukp", 
        messages=[{"role": "user", "content": user_prompt}]
    )
    message_content = response.choices[0].message.content.strip()
    return render_template('ContentGeneration.html', ai_response=message_content)


@app.route('/account-creation')
def account_creation():
    return render_template('AccountCreation.html')


# @app.route('/run-data-conversion', methods=['POST'])
# def run_data_conversion():
#     import subprocess
#     result = subprocess.run(['python3', 'Data/data_conversion.py'], capture_output=True, text=True)
#     print(result)
#     if result.returncode == 0:
#         return jsonify({'message': 'Data conversion script executed successfully'})
#     else:
#         return jsonify({'message': 'Data conversion script failed'}), 500

@app.route('/run-data-conversion', methods=['POST'])
def run_data_conversion():
    user_id = request.json.get('user_id')
    # Check if user_id is not None before proceeding
    if not user_id:
        return jsonify({'message': 'No user ID provided'}), 400
    
    import subprocess
    result = subprocess.run(['python3', 'Data/data_conversion.py', user_id], capture_output=True, text=True)
    if result.returncode == 0:
        return jsonify({'message': 'Data conversion script executed successfully'})
    else:
        # Return more information for debugging
        return jsonify({'message': f'Data conversion script failed: {result.stderr}'}), 500

if __name__ == '__main__':
    app.run(debug=True)

# DO NOT DELETE YET!!!!!!!!
# @app.route('/signup', methods=['POST'])
# def signup():
#     email = request.form['email']
#     password = request.form['password']
#     # Add user creation logic here using Firebase Admin SDK
#     try:
#         # Create user using Firebase Authentication
#         user = auth.create_user(email=email, password=password)

#         # Add user to Firestore
#         user_ref = db.collection('users').document(user.uid)
#         user_ref.set({
#             'email': email,
#             'password': password,
#             'training_data': '',
#             'model_id':'',
#             'generated_prompts':'',
#             'created_at': firestore.SERVER_TIMESTAMP
#         })

#         return 'User created successfully.'
#     except Exception as e:
#         return f'An error occurred: {str(e)}'

# @app.route('/signin', methods=['POST'])
# def signin():
#     email = request.form['email']
#     password = request.form['password']
#     try:
#         # Authenticate the user
#         user = auth.get_user_by_email(email)
#         # Check if the password is correct 
        
#         # If authentication is successful, redirect
#         return redirect('/content-generation')
#     except Exception as e:
#         return f'An error occurred: {str(e)}'

