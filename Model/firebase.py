import firebase_admin
from firebase_admin import credentials, firestore, auth

cred = credentials.Certificate("/Users/jessicanam/Documents/ghostwryte/Ghostwryrte.ai/Model/ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# Create a new user
user = auth.create_user(
    email='jessica@test.com',
    # email_verified=False,
    password='password',
)

user_ref = db.collection('users').document(user.uid)
user_ref.set({
    'email': 'jessica@test.com',
    'password': 'password',
    'training_data': 'training_data.jsonl',
    'model_id':'ft:gpt-3.5-turbo-0613:personal::8Slov9kq',
    'generated_prompts':''
    # Add other user data fields here
})

user_data = user_ref.get()
if user_data.exists:
    print(user_data.to_dict())
