# Firebase Setup Guide

## Firebase Realtime Database Rules

To allow messages to be sent and viewed by all users (guests and registered), you need to update your Firebase Realtime Database rules.

### Steps to Update RTDB Rules

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Select your project: `chat-f3a19`

2. **Navigate to Realtime Database**
   - In the left sidebar, go to **Build** → **Realtime Database**
   - Select your database instance

3. **Update Rules Tab**
   - Click on the **Rules** tab
   - Replace the existing rules with the content from `database.rules.json`:

```json
{
  "rules": {
    "messages": {
      "global": {
        ".read": true,
        ".write": "auth != null"
      },
      "direct": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "presence": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

4. **Publish**
   - Click **Publish** to apply the rules

### What These Rules Mean

- **`.read": true`**: Anyone can read messages and presence (no authentication required)
- **`.write": "auth != null"`**: Only authenticated users can write messages
  - Guests using `signInAnonymously()` are authenticated and can write
  - Registered users with email/password are authenticated and can write

### Firebase Authentication Setup

1. **Enable Anonymous Authentication**
   - Go to **Build** → **Authentication**
   - Click **Sign-in method** tab
   - Enable **Anonymous** sign-in method

2. **Enable Email/Password Authentication** (if not already enabled)
   - In the **Sign-in method** tab
   - Enable **Email/Password**

## Testing the Setup

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open two browser tabs/windows** (or use incognito mode)
   - Guest 1: Enter username and join
   - Guest 2: Enter a different username and join

3. **Send a message from Guest 1** in the Global Chat
   - You should see it appear in Guest 2's chat **in real-time**

4. **Test message history**
   - Refresh Guest 2's page
   - Previous messages from Guest 1 should still be visible

## Troubleshooting

### Messages not appearing?
1. Check browser console for errors (F12 → Console)
2. Verify RTDB rules are correctly set (auth != null allows writes)
3. Check if Anonymous authentication is enabled in Firebase
4. Verify the Firebase config keys in `src/firebase.js` are correct

### "Permission denied" error?
- RTDB rules are too restrictive. Make sure you've updated them as shown above.

### Real-time sync not working?
- Check network tab to see if WebSocket connections are established
- Try refreshing the page
- Verify both users are in the same chat (Global Chat or same Direct Message)

## Production Security Note

The rules above allow **public read access** to all messages. For production:
- Consider adding `.validate` rules to restrict message format
- Implement user-based read restrictions if needed
- Add rate limiting to prevent spam
- Use Firebase Security Rules emulator for local testing

