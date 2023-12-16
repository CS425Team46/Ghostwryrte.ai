# this is the code that will connect the rest of our application to the Postgres database

import psycopg
import uuid
from datetime import datetime

def connect_to_db():

    try:
        
        connection = psycopg.connect(

            user="morganyoung",
            password="1precious",
            host="localhost",
            port="5432",
            dbname="final_project_db"

        )
        
        return connection
    
    except (Exception, psycopg.Error) as error:

        print("Error while connecting to PostgreSQL:", error)
        return None
    


def create_new_user_acc(connection, cursor):

    first_name = input("Enter your first name: ")
    last_name = input("Enter your last name: ")
    email = input("Enter your email address: ")
    password = input("Enter your password: ")
    user_preferences = input("Enter your user preferences: ")

    user_id = str(uuid.uuid4())[:30]

    cursor.execute(

        'INSERT INTO useraccount (userID, passwordHash, email, userpreferences, lastname, firstname) VALUES (%s, %s, %s, %s, %s, %s)',
        (user_id, password[:32], email[:40], user_preferences[:1000], last_name[:60], first_name[:60]),

    )

    connection.commit()

    print("User account created successfully.")


def get_user_acc_info(connection, cursor):

    email = input("Enter your email address: ")

    cursor.execute("SELECT * FROM useraccount WHERE email = %s", (email,))
    user_data = cursor.fetchone()

    if user_data:

        print("\nUser Account Information:")
        print(f"User ID: {user_data[0]}")
        print(f"Last Name: {user_data[4]}")
        print(f"First Name: {user_data[5]}")
        print(f"Email: {user_data[2]}")
        print(f"User Preferences: {user_data[3]}")

    else:

        print("User not found.")


def create_new_content_draft(connection, cursor):

    user_id = input("Enter your userID: ")

    cursor.execute("SELECT * FROM useraccount WHERE userID = %s", (user_id,))
    user_exists = cursor.fetchone()

    if not user_exists:

        print("User not found. Please enter a valid userID.")
        return

    content_id = input("Enter a unique contentID (max 10 characters): ")

    cursor.execute("SELECT * FROM contentDraft WHERE contentID = %s", (content_id,))
    content_exists = cursor.fetchone()

    if content_exists:

        print("ContentID already exists. Please choose a unique contentID.")
        return

    content_title = input("Enter the content title (max 100 characters): ")
    content_body = input("Enter the content body (max 100,000 characters): ")

    creation_date = datetime.now()

    cursor.execute(

        "INSERT INTO contentDraft (contentID, userID, contentTitle, contentBody, creationDate) VALUES (%s, %s, %s, %s, %s)",
        (content_id[:10], user_id, content_title[:100], content_body[:100000], creation_date),

    )

    connection.commit()

    print("Content draft created successfully.")


def get_content_draft(connection, cursor):

    content_id = input("Enter the contentID: ")

    cursor.execute("SELECT * FROM contentDraft WHERE contentID = %s", (content_id,))
    content_data = cursor.fetchone()

    if content_data:

        print("\nContent Draft Information:")
        print(f"Content ID: {content_data[0]}")
        print(f"User ID: {content_data[1]}")
        print(f"Content Title: {content_data[2]}")
        print(f"Content Body: {content_data[3]}")
        print(f"Creation Date: {content_data[4]}")

    else:

        print("Content draft not found.")


def add_training_data(connection, cursor):

    user_id = input("Enter your userID: ")

    cursor.execute("SELECT * FROM useraccount WHERE userID = %s", (user_id,))
    user_exists = cursor.fetchone()

    if not user_exists:

        print("User not found. Please enter a valid userID.")
        return

    model_id = f"model_{user_id}"

    txt_file_path = input("Enter the path to your .txt file: ")

    try:

        with open(txt_file_path, "r") as file:

            training_data = file.read()

    except FileNotFoundError:

        print("File not found. Please enter a valid file path.")
        return

    training_status = "data uploaded, model not updated"

    cursor.execute(

        "INSERT INTO aiModel (modelID, userID, trainingData, trainingStatus) VALUES (%s, %s, %s, %s)",
        (model_id[:10], user_id, training_data[:10485760], training_status[:100]),

    )

    connection.commit()

    print("Training data added to AI model successfully.")


def feedback_submission(connection, cursor):

    user_id = input("Enter your userID: ")

    cursor.execute("SELECT * FROM useraccount WHERE userID = %s", (user_id,))
    user_exists = cursor.fetchone()

    if not user_exists:

        print("User not found. Please enter a valid userID.")
        return

    content_id = input("Enter the contentID you want to leave feedback on: ")

    cursor.execute("SELECT * FROM contentDraft WHERE contentID = %s", (content_id,))
    content_exists = cursor.fetchone()

    if not content_exists:

        print("Content not found. Please enter a valid contentID.")
        return

    feedback_id = f"feedback_{user_id}_{content_id}"

    comments = input("Enter your comments: ")
    
    while True:

        try:

            rating = int(input("Enter your rating (1-10): "))
            break

        except ValueError:

            print("Please enter a valid integer for the rating.")

    feedback_time = datetime.now()

    cursor.execute(

        "INSERT INTO feedbackManager (feedbackID, contentID, userID, comments, rating, feedbackTime) VALUES (%s, %s, %s, %s, %s, %s)",
        (feedback_id[:10], content_id[:10], user_id, comments[:1048570], rating, feedback_time),

    )

    connection.commit()

    print("Feedback submitted successfully.")