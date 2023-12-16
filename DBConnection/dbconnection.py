# this is the code that will connect the rest of our application to the Postgres database

import psycopg
import uuid
from datetime import datetime

# Function to connect to the PostgreSQL database
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
