Quick backend guide

- Ensure you have Python 3.11+ and a Firebase service account JSON.
- Set env var in PowerShell:

    $env:FIREBASE_SERVICE_ACCOUNT = "C:\path\to\serviceAccountKey.json"

- Install and run:

    python -m pip install -r backend/requirements.txt
    python backend/app.py

- To seed baseline documents: POST to http://localhost:5000/seed
