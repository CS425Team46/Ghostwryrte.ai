import openai
from openai import OpenAI


openai.api_key = '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'

client = OpenAI()

# Training data needs to be uploaded using the Files API in order to be used with fine-tuning jobs
# client.files.create(
#     file=open("data.jsonl", "rb"),
#     purpose="fine-tune"
# )

# Using the OpenAI SDK and the training file ID from above, start a fine-tuning job
client.fine_tuning.jobs.create(
    training_file="file-ctReRu28iP8pAJdFZstb0Yk9", # Can find in OpenAI API interface
    model="gpt-3.5-turbo" # chat/completeion format
)