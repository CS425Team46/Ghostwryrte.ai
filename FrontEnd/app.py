from flask import Flask, request, jsonify
import openai
from openai import OpenAI

app = Flask(__name__)

openai.api_key = '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' 
client = OpenAI() 

@app.route('/generate', methods=['POST'])
def generate_content():
    data = request.json
    user_prompt = data['prompt']

    response = client.chat.completions.create(
        model="ft:gpt-3.5-turbo-0613:personal::8SUilMlH", 
        messages=[{"role": "user", "content": "Write a social media post giving advice to computer science majors."}]
    )

    message_content = response.choices[0].message.content.strip()
    return jsonify({'message': message_content})

if __name__ == '__main__':
    app.run(debug=True)
