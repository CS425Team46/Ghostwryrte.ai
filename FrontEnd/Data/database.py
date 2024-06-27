from firebase_admin import firestore
import logging

class DataBase:

    def __init__(self):

        # initialize one instance of the database
        self.db = firestore.client()

        # set up logging
        logging.basicConfig(filename='finetuning_status.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


    # returns user documents
    def get_user_doc(self, user_id: str):
        return self.db.collection('users').document(user_id)

    
    def get_training_data(self, user_id: str):
        return self.get_user_doc(user_id).collection('files').stream()

    
    def get_latest_file_id(self, user_id: str):
        return self.get_user_doc(user_id).get().to_dict().get('model_id')



