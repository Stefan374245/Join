// Firebase configuration
// TODO: Replace with your actual Firebase config from Firebase Console
// Get your config from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general

export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'your-project-id.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project-id.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  n8nWebhookUrl: 'http://localhost:5678/webhook/feature-request',
};
