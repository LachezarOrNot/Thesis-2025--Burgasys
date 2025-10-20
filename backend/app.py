from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin
cred_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
if not cred_path:
    print('FIREBASE_SERVICE_ACCOUNT env var not set - backend will not initialize')
else:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

@app.route('/')
def index():
    return jsonify({'status': 'ok', 'message': 'Backend running'})

@app.route('/create-event', methods=['POST'])
def create_event():
    if 'db' not in globals():
        return jsonify({'error': 'Firebase not configured on backend'}), 500
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    # Parse ISO date strings if provided so Firestore stores timestamps
    for key in ('start_datetime', 'end_datetime'):
        if key in data and isinstance(data[key], str):
            try:
                # fromisoformat supports 'YYYY-MM-DDTHH:MM:SS' formats
                data[key] = datetime.fromisoformat(data[key])
            except Exception:
                # leave as-is if parsing fails
                pass

    doc_ref = db.collection('events').document()
    data['id'] = doc_ref.id
    data.setdefault('images', [])
    data.setdefault('registeredUsers', [])
    data['createdAt'] = firestore.SERVER_TIMESTAMP
    data['updatedAt'] = firestore.SERVER_TIMESTAMP
    doc_ref.set(data)
    return jsonify({'status': 'created', 'id': doc_ref.id}), 201

@app.route('/seed', methods=['POST'])
def seed():
    if 'db' not in globals():
        return jsonify({'error': 'Firebase not configured on backend'}), 500
    # Create minimal collections
    sample_user = {
        'uid': 'sample-user',
        'email': 'user@example.com',
        'displayName': 'Sample User',
        'role': 'user',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'updatedAt': firestore.SERVER_TIMESTAMP
    }
    db.collection('users').document(sample_user['uid']).set(sample_user)

    # Ensure chatMessages, notifications and eventRegistrations exist by adding a sample doc
    db.collection('chatMessages').document('sample-msg').set({
        'id': 'sample-msg',
        'eventId': 'sample-event',
        'senderUid': 'sample-user',
        'text': 'Hello world',
        'timestamp': firestore.SERVER_TIMESTAMP
    })

    db.collection('notifications').document('sample-notif').set({
        'id': 'sample-notif',
        'userId': 'sample-user',
        'title': 'Welcome',
        'body': 'This is a sample notification',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'read': False
    })

    db.collection('eventRegistrations').document('sample-reg').set({
        'id': 'sample-reg',
        'eventId': 'sample-event',
        'userUid': 'sample-user',
        'status': 'registered',
        'registeredAt': firestore.SERVER_TIMESTAMP
    })

    return jsonify({'status': 'seeded'}), 200


@app.route('/ensure-collections', methods=['POST'])
def ensure_collections():
    """Create minimal documents in required collections if they don't exist."""
    if 'db' not in globals():
        return jsonify({'error': 'Firebase not configured on backend'}), 500

    collections = ['events', 'users', 'chatMessages', 'notifications', 'eventRegistrations']
    created = []
    for col in collections:
        docs = list(db.collection(col).limit(1).stream())
        if not docs:
            # create a placeholder doc
            doc_ref = db.collection(col).document()
            doc_ref.set({'_placeholder': True, 'createdAt': firestore.SERVER_TIMESTAMP})
            created.append(col)

    return jsonify({'created': created}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
