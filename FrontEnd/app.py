from threading import Thread
from urllib.parse import urljoin

import stripe
import tiktoken
from flask import Flask, jsonify, render_template, request, url_for

from Data.ai_client import AI_Client
from Data.database import DataBase
from Data.authentication import Authentication
from Data.data_conversion import Data_Conversion

# initialize the flask app
app = Flask(__name__)

# initialize variable that stores all of our authentication values
keyring = Authentication()

# initialize the database wrapper interface
database = DataBase(keyring.FIREBASE_CREDENTIALS)

# initialize the OpenAI API wrapper interface
ai_client = AI_Client(api_key=keyring.OPENAI_API_KEY, db=database)

# initialize the data_conversion class to be used later in the file
data_conversion = Data_Conversion(db=database, client=ai_client)

# set the stripe API key
stripe.api_key = keyring.STRIPE_SECRET_KEY



# define a token encoder to get the token count for strings
token_encoder = tiktoken.encoding_for_model("gpt-3.5-turbo")



@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():

    base_url = request.host_url

    success_url = urljoin(base_url, url_for("success"))
    cancel_url = urljoin(base_url, url_for("cancel"))
    print(success_url)
    print(cancel_url)

    print("Received request to create a checkout session")

    try:
        session = stripe.checkout.Session.create(
            success_url="http://127.0.0.1:5000/success",
            cancel_url="http://127.0.0.1:5000/content-generation",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": "price_1P2m0HK9QOcf8ycFEdCqu3ZA",
                    "quantity": 1,
                },
            ],
            mode="subscription",
        )
        return jsonify({"id": session.id})
    except Exception as e:
        print(e)  # Log the error to your Flask app's console
        return jsonify({"error": str(e)}), 403


def run_model_training_in_background(user_id):
    """Run the model training script in a background thread."""
   
    result = ai_client.model_training(user_id)

    # Handling the script result
    if result:
        print("Model training successful")
    else:
        print("Model training script failed")


# TODO: real values in this function
# this is just scaffolding, it accpets what specific prompt the user wants as a string (this can be changed)
# and returns a string that will be assigned as the system before the prompt we can change this to our specific
# use-case but this is what it should look like.
def get_specific_platform_prompt_tuning(promptID: str):
    if promptID == "instagram":
        return "instagram prompt"
    elif promptID == "facebook":
        return "facebook prompt"
    elif promptID == "linkedin":
        return "linkedin prompt"
    else:
        return ""


@app.route("/subscribe")
def subscribe():
    return render_template("subscribe.html")


@app.route("/success")
def success():
    return render_template("SubscriptionSuccess.html")


@app.route("/cancel")
def cancel():
    return render_template("SubscriptionCancel.html")


@app.route("/")
def home():
    return render_template("LandingPage.html")


@app.route("/pricing")
def pricing():
    return render_template("LandingPagePricing.html")


@app.route("/accountCreation")
def account_creation():
    return render_template("AccountCreation.html")


@app.route("/password-reset")
def password_reset():
    return render_template("passwordReset.html")


@app.route("/content-generation")
def content_generation():
    return render_template("ContentGeneration.html")


@app.route("/ai-training")
def ai_training():
    return render_template("AITraining.html")


@app.route("/generation-history")
def generation_history():
    return render_template("GenerationHistory.html")


# TODO: there is a lot of repeated code here, OOP might be a valid consideration
@app.route("/refresh-model", methods=["POST"])
def refresh_model():

    # gets the user id
    user_id = request.form.get("user_id")  # TODO: let frontend pass this data 

    # Handle cases where data is missing
    if not user_id:
        return jsonify({"message": "Missing user ID"}), 400
    
    # gets the model id from user docs
    model_id = database.get_from_user_doc(user_id, 'model_id')

    if not model_id:
        return jsonify({"message": "Model ID not found for user"}), 400

    # proceed with deletion if the model and user exists

    # deletes the current model assigned to the user
    ai_client.delete_model(model_id)

    # this should start a new model and assign it to the current user
    return start_model_training()


@app.route("/generate-content", methods=["POST"])
def generate_content():
    # Fetch the data from form fields
    user_id = request.form.get("user_id")
    user_prompt = request.form.get("user_prompt")

    # Handle cases where data is missing
    if not user_id or not user_prompt:
        return jsonify({"message": "Missing user ID or prompt"}), 400

    # gets the model id from user docs
    model_id = database.get_from_user_doc(user_id, 'model_id')

    if not model_id:
            return jsonify({"message": "Model ID not found for user"}), 400

    print(model_id)

    frontend_word_limit = 100  # TODO: somehow communicate the user input for the character limit here, 100 is a placeholder
    frontend_word_limit *= 3  # average of 3-4 tokens per word so multiply the word limit by 3 to get token limit

    # count the tokens in the prompt
    prompt_token_count = len(token_encoder.encode(user_prompt))

    response = ai_client.client.chat.completions.create(
        model=model_id,  # Use the fetched model_id
        max_tokens=frontend_word_limit + prompt_token_count,
        messages=[
            {
                "role": "system",
                "content": get_specific_platform_prompt_tuning(""),
            },  # the input to this function will be a value from the dropdown on the frontend
            {"role": "user", "content": user_prompt},
        ],
    )
    message_content = response.choices[0].message.content.strip() # type: ignore
    return jsonify({"ai_response": message_content})
    ## return render_template('ContentGeneration.html', ai_response=message_content)


@app.route("/run-data-conversion", methods=["POST"])
def run_data_conversion():
    data = request.json

    user_id = data.get("user_id") # type: ignore
    session_id = data.get("session_id") # type: ignore

    if not user_id or not session_id:
        return jsonify({"message": "No user ID or session ID provided"}), 400

    result = data_conversion.main(user_id, session_id)

    if result:
        return jsonify({"message": "Data conversion script executed successfully"})
    else:
        return (
            jsonify({"message": "Data conversion script failed"}), 500)


@app.route("/start-model-training", methods=["POST"])
def start_model_training():
    user_id = request.json.get("user_id") # type: ignore
    if not user_id:
        return jsonify({"message": "No user ID provided"}), 400

    # Start the model training in a background thread
    thread = Thread(target=run_model_training_in_background, args=(user_id,))
    thread.daemon = True  # Optionally, make the thread a daemon
    thread.start()

    # Return a response immediately
    return (jsonify({"message": "Model training has been started. Please check back later for results."}), 202)

def main():
    app.run(debug=True)
