🎪 EventHub - Event Management Platform
EventHub is a modern, full-stack event management web application built with React, TypeScript, and Firebase. Connect with communities, discover amazing events, and create unforgettable experiences.

https://img.shields.io/badge/EventHub-Event%2520Management-blue
https://img.shields.io/badge/React-18.2.0-61dafb
https://img.shields.io/badge/TypeScript-4.9.4-3178c6
https://img.shields.io/badge/Firebase-Backend-ffca28

✨ Features
🎯 6 User Roles (Admin, School, Firm, User, Student, University Student)

🔐 Authentication (Email/Password + Google OAuth)

🏢 Organization Management with verification system

📅 Event Creation & Management with approval workflow

💬 Real-time Chat for event participants

📍 Location Services with Google Maps integration

🎨 Responsive Design with Dark/Light theme

📱 Mobile-First approach

🔔 Real-time Notifications

📊 Admin Dashboard for moderation

🚀 Quick Start
Prerequisites
Node.js (version 16 or higher)

npm (comes with Node.js)

Firebase account (free)

Installation
Clone the repository


git clone the link
cd eventbeta

Install dependencies

npm install
Set up Firebase (one-time setup)

🔥 Firebase Setup Guide
Step 1: Create Firebase Project
Go to Firebase Console

Click "Create a project"

Name: eventbeta (or your preferred name)

Disable Google Analytics (not needed)

Click "Create project"

Step 2: Enable Authentication
In your Firebase project → Authentication

Click "Get started"

Go to Sign-in method tab

Enable:

Email/Password (toggle to enable)

Google (click, enable, and save)

Step 3: Create Firestore Database
Go to Firestore Database

Click "Create database"

Choose "Start in test mode"

Select your location

Click "Done"

Step 4: Enable Storage
Go to Storage

Click "Get started"

Choose "Start in test mode"

Select your location

Click "Done"

Step 5: Get Firebase Configuration
Go to Project Settings (gear icon)

Scroll to "Your apps"

Click Web icon (</>)

App nickname: eventbeta-web

Click "Register app"

Copy the firebaseConfig object

📁 Environment Variables Setup
Create a .env file in the project root:

env
# Firebase Configuration (REQUIRED)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Maps (OPTIONAL - for location features)
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
Replace each value with your actual Firebase configuration from Step 5.

🛡️ Deploy Security Rules
bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# ❯ Firestore: Configure security rules
# ❯ Storage: Configure security rules
# ❯ Use existing project → Select your EventHub project
# ❯ Use default file names

# Deploy security rules
firebase deploy --only firestore:rules,storage
🎉 Run the Application
bash
# Start development server
npm run dev
Your app will be available at: http://localhost:5173

👑 Create Admin User
Sign up as a regular user through the app

Go to Firebase Console → Firestore Database

Find your user in the users collection

Edit the document and change role from "user" to "admin"

Refresh the app - you'll now see Admin features

📁 Project Structure

eventbeta/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages
│   ├── contexts/      # React contexts (Auth, Theme)
│   ├── services/      # Firebase and API services
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── public/            # Static assets
└── configuration files
