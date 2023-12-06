from flask import Flask, render_template
app = Flask(__name__)
 
@app.route('/')
def home():
   return render_template('ContentGeneration.html')
if __name__ == '__main__':
   app.run(debug=True)

@app.route('/ai-training')
def ai_training():
    return render_template('AITraining.html')

@app.route('/styling-and-format')
def styling_and_format():
    return render_template('StylingAndFormat.html')