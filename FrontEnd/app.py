from flask import Flask, render_template, request
import openai
from openai import OpenAI
import firebase_admin
from firebase_admin import credentials, firestore, auth

cred = credentials.Certificate("/Users/jessicanam/Documents/ghostwryte/Ghostwryrte.ai/Model/ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

client = OpenAI()

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('AccountCreation.html')

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
        model="ft:gpt-3.5-turbo-0613:personal::8Slov9kq", 
        messages=[{"role": "user", "content": user_prompt}]
    )
    message_content = response.choices[0].message.content.strip()
    return render_template('ContentGeneration.html', ai_response=message_content)

@app.route('/account-creation')
def account_creation():
    return render_template('AccountCreation.html')

@app.route('/signup', methods=['POST'])
def signup():
    email = request.form['email']
    password = request.form['password']
    # Add user creation logic here using Firebase Admin SDK
    try:
        # Create user using Firebase Authentication
        user = auth.create_user(email=email, password=password)

        # Add user to Firestore
        user_ref = db.collection('users').document(user.uid)
        user_ref.set({
            'email': email,
            'password': password,
            'training_data': '',
            'model_id':'',
            'generated_prompts':'',
            'created_at': firestore.SERVER_TIMESTAMP
        })

        return 'User created successfully.'
    except Exception as e:
        return f'An error occurred: {str(e)}'


if __name__ == '__main__':
    app.run(debug=True)
