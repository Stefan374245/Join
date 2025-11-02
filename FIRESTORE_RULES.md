# Firestore Security Rules

## Current Rules (Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - stores registered user profiles for contacts
    match /users/{userId} {
      // Any authenticated user can read all users (for contacts list)
      allow read: if request.auth != null;
      // Users can only write their own profile
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks collection - for future task assignment feature
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## What this means:

### `/users` collection:
- ✅ **Read**: Any authenticated user can read all user profiles (needed for contacts list)
- ⚠️ **Write**: Users can only create/update their own profile
- 📝 **Purpose**: Stores registered user data for the contacts list and task assignment

### `/tasks` collection (future):
- ✅ **Read**: Any authenticated user can read all tasks
- ✅ **Write**: Any authenticated user can create/update tasks
- 📝 **Purpose**: Will be used for task management and user assignment

## ⚠️ Important Notes:

1. **These are DEVELOPMENT rules** - suitable for testing and development
2. **Before going to production**, you should:
   - Restrict contact writes to only the contact's owner
   - Restrict login reads to only the user's own data
   - Add data validation rules

## Production-Ready Rules (Future)

When ready for production, update to more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Contacts: authenticated users can read all, write only their own
    match /contact/{contactId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                             resource.data.email == request.auth.token.email;
    }
    
    // Login data: users can only access their own
    match /login/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## How to Update Rules:

1. Go to: https://console.firebase.google.com/project/join-angular-based/firestore/rules
2. Replace the rules with the desired version
3. Click "Publish"
4. Wait 30-60 seconds for propagation
5. Refresh your app

## Troubleshooting:

If you still get "Missing or insufficient permissions":
1. Make sure you're logged in (check `authService.user$`)
2. Check browser console for auth errors
3. Verify rules are published in Firebase Console
4. Try logging out and back in
5. Clear browser cache and localStorage
