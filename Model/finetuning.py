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
# client.fine_tuning.jobs.create(
#     training_file="file-tyxRPuwpCTaDcV3o5ETgz0Ie", # Can find in OpenAI API interface
#     model="gpt-3.5-turbo" # chat/completeion format
# )

# List fine-tuning jobs
print(client.fine_tuning.jobs.list(limit=1))

# Retrieve the state of a fine-tune
print(client.fine_tuning.jobs.retrieve("ftjob-4G1by3VoLtqMbkj2SMLtuNvW"))

# List events from a fine-tuning job
print(client.fine_tuning.jobs.list_events(fine_tuning_job_id="ftjob-4G1by3VoLtqMbkj2SMLtuNvW", limit=10))