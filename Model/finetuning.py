import openai
from openai import OpenAI


openai.api_key = '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'

client = OpenAI()

# # Training data needs to be uploaded using the Files API in order to be used with fine-tuning jobs
# client.files.create(
#     file=open("data.jsonl", "rb"),
#     purpose="fine-tune"
# )

# Using the OpenAI SDK, start a fine-tuning job
client.fine_tuning.jobs.create(
    training_file="file-hROdaBZCBLy31KnD3Fq3wSwA", # Can find in OpenAI API interface
    model="gpt-3.5-turbo" # char/completeion format
)