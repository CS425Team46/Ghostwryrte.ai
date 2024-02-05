### SOME ENVIRONMENT VARIABLES YOU MIGHT NEED!!!
#  When getting OpenAI finetuning api key error: export OPENAI_API_KEY="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" 

import openai
from openai import OpenAI
import os

# file-tyxRPuwpCTaDcV3o5ETgz0Ie
# ft:gpt-3.5-turbo-0613:personal::8SUilMlH

# NOTE: When using a new API key, assign to environment vairable first (export OPENAI_API_KEY="<OPENAI_API_KEY>")

client = OpenAI()

# Training data needs to be uploaded using the Files API in order to be used with fine-tuning jobs
# client.files.create(
#     file=open("/Users/jessicanam/Documents/Ghostwyrte.ai/Ghostwryrte.ai/Model/training_data.jsonl", "rb"),
#     purpose="fine-tune"
# )

# Using the OpenAI SDK and the training file ID from above, start a fine-tuning job
response = client.fine_tuning.jobs.create(
    training_file="file-f8MVqnhCNwMSgKjRUk4WXQEm", # Can find in OpenAI API interface
    model="gpt-3.5-turbo", # chat/completeion format
    hyperparameters={
    "n_epochs": 15,
	"batch_size": 3,
	"learning_rate_multiplier": 0.3
  }
)

# Define your hyperparameters and file paths
# model_engine = "gpt-3.5-turbo"
# n_epochs = 6
# batch_size = 8
# learning_rate = 0.1  
# max_tokens = 1024    
# training_file = "/Users/jessicanam/Documents/Ghostwyrte.ai/Ghostwryrte.ai/Model/training_data.jsonl"  

# # Create the fine-tuning job
# openai.FineTune.create(
#     model_engine=model_engine,
#     n_epochs=n_epochs,
#     batch_size=batch_size,
#     learning_rate=learning_rate,
#     max_tokens=max_tokens,
#     training_file=os.path.abspath(training_file),
# )


# # List fine-tuning jobs
# print(client.fine_tuning.jobs.list(limit=1))

# # Retrieve the state of a fine-tune
# print(client.fine_tuning.jobs.retrieve("ftjob-4G1by3VoLtqMbkj2SMLtuNvW"))

# # List events from a fine-tuning job
# print(client.fine_tuning.jobs.list_events(fine_tuning_job_id="ftjob-4G1by3VoLtqMbkj2SMLtuNvW", limit=10))


# response = client.chat.completions.create(
#     model="ft:gpt-3.5-turbo-0613:personal::8Slov9kq", 
#     messages=[{"role": "user", "content": "Write a social media post announcing 5 new Product Managementinternships."}]
# )

# # Accessing the content of the message
# message_content = response.choices[0].message.content.strip()
# print(message_content)
