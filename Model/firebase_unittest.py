import unittest
import firebase_admin
from firebase_admin import credentials, firestore, auth

class TestFirebaseFunctionality(unittest.TestCase):

    def setUp(self):
        cred = credentials.Certificate("/Users/morganyoung/Desktop/Ghostwryrte.ai/FrontEnd/ghostwryte-ai-firebase-adminsdk-uxybq-20881dd0dd.json")
        firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def tearDown(self):
        # Clean up any test data
        user = auth.get_user_by_email('random@test.com')
        self.db.collection('users').document(user.uid).delete()
        auth.delete_user(user.uid)

    def test_user_creation_and_data_storing(self):
        user = auth.create_user(
            email='random@test.com',
            password='password',
        )

        user_ref = self.db.collection('users').document(user.uid)
        user_ref.set({
            'email': 'random@test.com',
            'password': 'password',
            'training_data': 'training_data.jsonl',
            'model_id':'ft:gpt-3.5-turbo-0613:personal::8Slov9kq',
            'generated_prompts':''
        })

        user_data = user_ref.get()
        self.assertTrue(user_data.exists)

if __name__ == '__main__':
    unittest.main()
