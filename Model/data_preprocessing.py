import json
import re
import demoji

def preprocess_jsonl(input_file, output_file):
    # demoji.download_codes()  # Download the emoji library data (only needs to be done once)

    with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
        for line in infile:
            try:
                data = json.loads(line)
                if 'messages' in data and isinstance(data['messages'], list):
                    for message in data['messages']:
                        if 'content' in message and isinstance(message['content'], str):
                            # Remove emojis
                            message['content'] = demoji.replace(message['content'], '')
                            # Replace double quotes with single quotes
                            message['content'] = message['content'].replace('"', "'")
                            # Remove foreign symbols
                            message['content'] = re.sub(r'[^\x00-\x7F]+', '', message['content'])
                            # Remove italics and highlights
                            message['content'] = re.sub(r'\*|_', '', message['content'])
                            # Remove newlines
                            message['content'] = message['content'].replace('\n', '')
                outfile.write(json.dumps(data) + '\n')
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON: {line.strip()}")

# Example usage:
input_file = 'data.jsonl'
output_file = 'data1.jsonl'
preprocess_jsonl(input_file, output_file)
