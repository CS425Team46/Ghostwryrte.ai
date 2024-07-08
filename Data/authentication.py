import json
import os


class Authentication:


    OPENAI_API_KEY: str
    FIREBASE_CREDENTIALS: dict
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_SECRET_KEY: str

    # will try to grab data from the auth_keys file on startup
    def __init__(self):

        # finds the filename of the authentication file
        self.auth_file = os.path.dirname(__file__) + "/../auth_keys.json" 

        try:
            # tries to open the file
            with open(self.auth_file, "r") as file:
                self.auth_data = json.loads(file.read())
                
        # catches an error where the file DNE
        except FileNotFoundError:
            self.auth_data = None

        # if the file existed, get data from it's contents
        if self.auth_data:
            self.OPENAI_API_KEY = self.auth_data["OPENAI_API_KEY"]
            self.FIREBASE_CREDENTIALS = self.auth_data["FIREBASE_CREDENTIALS"]
            self.STRIPE_PUBLISHABLE_KEY = self.auth_data["STRIPE_PUBLISHABLE_KEY"]
            self.STRIPE_SECRET_KEY = self.auth_data["STRIPE_SECRET_KEY"]
        # otherwise, grab it from environment variables
        else:
            self.OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY") # type: ignore
            self.FIREBASE_CREDENTIALS = os.environ.get("FIREBASE_CREDENTIALS") # type: ignore
            self.STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY") #type: ignore
            self.STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY") #type: ignore

      
        # TODO: If we ever upgrade to python >= 3.10, I can make this a lot slicker with a match case.

        # don't let the program continue if a key is not found
        if not self.OPENAI_API_KEY or not self.FIREBASE_CREDENTIALS or not self.STRIPE_PUBLISHABLE_KEY or not self.STRIPE_SECRET_KEY:
            print("One or more authentication / API keys is missing!")
            quit()

        else:
            print("All authentication and API keys found and loaded!")
