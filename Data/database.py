from firebase_admin import firestore
from google.cloud.firestore import DocumentReference


# simple object to clean up usage of the database
class DataBase:

    def __init__(self):

        # initialize one instance of the database
        self.db = firestore.client()

    # returns user documents
    def get_user_ref(self, user_id: str) -> DocumentReference:
        return self.db.collection("users").document(user_id)

    # returns training data list
    def get_training_data(self, user_id: str, session_id: str) -> list:
        return self.get_user_ref(user_id).collection(f"files_{session_id}").stream()

    # returns the given data from the user doc
    def get_from_user_doc(self, user_id: str, data: str, default=None) -> str | None:
        user_doc = self.get_user_ref(user_id).get()
        if user_doc.exists:
            return user_doc.to_dict().get(data)  # type: ignore
        else:
            return default

    # updates a datapoint for the given user
    def update_data(self, user_id: str, data_name: str, data: str) -> None:
        self.get_user_ref(user_id).update({data_name: data})
