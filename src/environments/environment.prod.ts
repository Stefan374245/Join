// Production Firebase configuration
// TODO: Replace with your actual Firebase config from Firebase Console
// IMPORTANT: Do NOT commit your real API keys to GitHub!

export const environment = {
  production: true,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'your-project-id.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project-id.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  n8nWebhookUrl: 'https://your-n8n-domain.com/webhook/feature-request',
};
