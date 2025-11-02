# Firestore Security Rules

## Current Rules (Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - stores both registered users and contacts
    match /users/{userId} {
      // Any authenticated user can read all users (for contacts list)
      allow read: if request.auth != null;
      
      // Allow authenticated users to create new contacts (contacts-only, not auth users)
      // Allow users to update their own profile (when userId matches auth UID)
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                     (request.auth.uid == userId || request.auth.uid == resource.data.userId);
      allow delete: if request.auth != null && 
                     (request.auth.uid == userId || request.auth.uid == resource.data.userId);
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
- ✅ **Create**: Any authenticated user can create new contacts (for contact management)
- ✅ **Update**: Users can update their own profile OR contacts they created
- ✅ **Delete**: Users can delete their own profile OR contacts they created
- 📝 **Purpose**: Stores both registered user data AND non-auth contacts for the contacts list

**Two types of users:**
1. **Registered Users**: Created via Firebase Auth signup, userId = auth.uid
2. **Contacts Only**: Created manually via "Add Contact", userId = sanitized email

### `/tasks` collection (future):
- ✅ **Read**: Any authenticated user can read all tasks
- ✅ **Write**: Any authenticated user can create/update tasks
- 📝 **Purpose**: Will be used for task management and user assignment

## ⚠️ Important Notes:

1. **These are DEVELOPMENT rules** - suitable for testing and development
2. **The current rules allow any authenticated user to create contacts** - this is needed for the contact management feature
3. **Before going to production**, you should:
   - Add data validation rules (email format, required fields)
   - Add rate limiting
   - Consider adding a `createdBy` field to track who created each contact

## How to Apply These Rules:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `join-angular-based`
3. Navigate to: **Firestore Database** → **Rules** tab
4. Copy the rules from the section above
5. Click **Publish**

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
