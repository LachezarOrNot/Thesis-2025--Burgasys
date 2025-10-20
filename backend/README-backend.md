Backend README

This backend provides server-side Firestore writes using the Firebase Admin SDK.

Setup

1. Create a Firebase service account JSON and save it on your machine.
2. Set the environment variable FIREBASE_SERVICE_ACCOUNT to the path of that JSON.

Example (PowerShell):

    $env:FIREBASE_SERVICE_ACCOUNT = "C:\path\to\serviceAccountKey.json"

Then install dependencies and run:

    python -m pip install -r requirements.txt
    python app.py

Endpoints

- GET / -> health check
- POST /create-event -> accepts event JSON and writes to Firestore
- POST /seed -> creates sample documents for `users`, `chatMessages`, `notifications`, `eventRegistrations`
