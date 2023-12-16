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
    

# creating a new user account
def create_new_user_acc(connection, cursor):

    # Prompt user for information
    first_name = input("Enter your first name: ")
    last_name = input("Enter your last name: ")
    email = input("Enter your email address: ")
    password = input("Enter your password: ")
    user_preferences = input("Enter your user preferences: ")

    # Generate a unique user ID
    user_id = str(uuid.uuid4())[:30]

    # Insert user data into the database
    cursor.execute(

        'INSERT INTO useraccount (userID, passwordHash, email, userpreferences, lastname, firstname) VALUES (%s, %s, %s, %s, %s, %s)',
        (user_id, password[:32], email[:40], user_preferences[:1000], last_name[:60], first_name[:60]),

    )

    # Commit the changes
    connection.commit()

    print("User account created successfully.")