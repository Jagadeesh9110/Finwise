# This code sets up a simple Flask application with one route: /process_query. 
# When your Node.js backend sends a request to this route, it will receive a confirmation message back.

import os
from flask import Flask,request,jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

@app.route('/process_query', methods=['POST'])
def process_query():
    """
    This is the main endpoint that Node.js server will call.
    For now, it simply confirms that it received the request.
    """
    # Get the data sent from the Node.js server
    data = request.json
    user_query = data.get('query', 'No query provided')
    
    print(f"Received query from Node.js: {user_query}")

    # --- Placeholder Response ---
    # Later, we will replace this with the full agent crew logic.
    response_data = {
        "response": f"Python AI Service received your query: '{user_query}'. The agents are not yet connected."
    }
    
    return jsonify(response_data)

if __name__ == '__main__':
    # This runs the Flask server on http://localhost:5001
    # The debug=True flag allows the server to auto-reload when you save changes.
    app.run(port=5001, debug=True)