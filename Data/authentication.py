import json
import os


class Authentication:


    OPENAI_API_KEY: str
    FIREBASE_CREDENTIALS: dict
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_SECRET_KEY: str

    # will try to grab data from the auth_keys file on startup
    def __init__(self):
        directory = os.path.dirname(__file__)
        self.auth_file = directory + "/../auth_keys.json" # we should switch to absolute file finding in the future

        try:
            with open(self.auth_file, "r") as file:
                self.auth_data = json.loads(file.read())
                

        except Exception as e:
            self.auth_data = None
            print(e)

        if self.auth_data:
            self.OPENAI_API_KEY = self.auth_data["OPENAI_API_KEY"]
            self.FIREBASE_CREDENTIALS = self.auth_data["FIREBASE_CREDENTIALS"]
            self.STRIPE_PUBLISHABLE_KEY = self.auth_data["STRIPE_PUBLISHABLE_KEY"]
            self.STRIPE_SECRET_KEY = self.auth_data["STRIPE_SECRET_KEY"]

        else:
            self.OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY") # type: ignore
            self.FIREBASE_CREDENTIALS = os.environ.get("FIREBASE_CREDENTIALS") # type: ignore
            self.STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY") #type: ignore
            self.STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY") #type: ignore

      
        # TODO: If we ever upgrade to python 3.10, I can make this a lot slicker with a match case.
        if not self.OPENAI_API_KEY or not self.FIREBASE_CREDENTIALS or not self.STRIPE_PUBLISHABLE_KEY or not self.STRIPE_SECRET_KEY:
            print("One or more authentication / API keys is missing!")
            quit()

        else:
            print("All authentication and API keys found and loaded!")
