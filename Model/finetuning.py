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

# # List fine-tuning jobs
# print(client.fine_tuning.jobs.list(limit=1))

# # Retrieve the state of a fine-tune
# print(client.fine_tuning.jobs.retrieve("ftjob-4G1by3VoLtqMbkj2SMLtuNvW"))

# # List events from a fine-tuning job
# print(client.fine_tuning.jobs.list_events(fine_tuning_job_id="ftjob-4G1by3VoLtqMbkj2SMLtuNvW", limit=10))


response = client.chat.completions.create(
    model="ft:gpt-3.5-turbo-0613:personal::8SUilMlH", 
    messages=[{"role": "user", "content": "Write a social media post giving advice to computer science majors."}]
)

# Accessing the content of the message
message_content = response.choices[0].message.content.strip()
print(message_content)
