from flask import Flask, render_template, request
import openai
from openai import OpenAI

client = OpenAI()

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('ContentGeneration.html')

@app.route('/ai-training')
def ai_training():
    return render_template('AITraining.html')

@app.route('/styling-and-format')
def styling_and_format():
    return render_template('StylingAndFormat.html')

@app.route('/generate-content', methods=['POST'])
def generate_content():
    user_prompt = request.form['user_prompt']
    # Call AI model with the user_prompt
    response = client.chat.completions.create(
        model="ft:gpt-3.5-turbo-0613:personal::8Slov9kq", 
        messages=[{"role": "user", "content": user_prompt}]
    )
    message_content = response.choices[0].message.content.strip()
    return render_template('ContentGeneration.html', ai_response=message_content)

if __name__ == '__main__':
    app.run(debug=True)
