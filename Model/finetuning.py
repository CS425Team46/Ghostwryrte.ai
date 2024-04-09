### SOME ENVIRONMENT VARIABLES YOU MIGHT NEED!!!
#  When getting OpenAI finetuning api key error: export OPENAI_API_KEY="API_KEY" 

import openai
from openai import OpenAI
import os

# # NOTE: When using a new API key, assign to environment vairable first (export OPENAI_API_KEY="<OPENAI_API_KEY>")

client = OpenAI()

# ## STEP 1: UPLOAD TRAINING DATA
# Training data needs to be uploaded using the Files API in order to be used with fine-tuning jobs
client.files.create(
    file=open("/Users/jessicanam/Desktop/GW49/Ghostwryrte.ai/Model/training_data.jsonl", "rb"),
    purpose="fine-tune"
)

### STEP 2: TRAIN MODEL - NO HYPERPARAM VS HYPERPARA,
### NO HYPERPARAMS
# # Using the OpenAI SDK and the training file ID from above, start a fine-tuning job
# client.fine_tuning.jobs.create(
#     training_file="file-ISCwByIiBChXBDPYFkSFwvXJ", # Can find in OpenAI API interface
#     model="gpt-3.5-turbo" # chat/completeion format
# )

### YES HYPERPARAMS
# Create the fine-tuning job
# response = client.fine_tuning.jobs.create(
#   training_file="file-ISCwByIiBChXBDPYFkSFwvXJ", 
#   model="gpt-3.5-turbo", 
#   hyperparameters={
#     "n_epochs": 15,
# 	"batch_size": 5,
# 	"learning_rate_multiplier": 0.1
#   }
# )

### STEP 3. USE MODEL
# response = client.chat.completions.create(
#     model="ft:gpt-3.5-turbo-0613:personal::8pvGEukp", 
#     messages=[{"role": "user", "content": "Write a social media post talking about my pat experinces in coding."}]
# )

# Accessing the content of the message
# message_content = response.choices[0].message.content.strip()
# print(message_content)

# # List fine-tuning jobs
# print(client.fine_tuning.jobs.list(limit=1))

# # Retrieve the state of a fine-tune
# print(client.fine_tuning.jobs.retrieve("ftjob-4G1by3VoLtqMbkj2SMLtuNvW"))

# # List events from a fine-tuning job
# print(client.fine_tuning.jobs.list_events(fine_tuning_job_id="ftjob-4G1by3VoLtqMbkj2SMLtuNvW", limit=10))