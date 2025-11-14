# Notice Board with Firebase Authentication

A modern notice board application built with React and Firebase, featuring user authentication and admin-only posting capabilities.

## Features

- **User Authentication**: Sign up and login with email/password
- **Admin-Only Posting**: Only users with the admin email can post, edit, and delete notices
- **Real-time Updates**: Notices update in real-time using Firebase Firestore
- **Category & Priority Filters**: Filter notices by category and priority level
- **Search Functionality**: Search notices by title or content
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Setup Instructions

### 1. Firebase Configuration

The Firebase configuration is already set up in `src/firebase.js`:
- **Admin Email**: `admin@notices.com` (hardcoded for security)
- **Project**: notice-2eca2

### 2. Authentication Flow

#### For Admin Users:
1. Sign up with email: `admin@notices.com` and any password (minimum 6 characters)
2. Login with the same credentials
3. You'll see the "Admin" badge and "New Notice" button in the header
4. You can create, edit, and delete notices

#### For Regular Users:
1. Sign up with any email address (not `admin@notices.com`)
2. Login with your credentials
3. You can view all notices but cannot post, edit, or delete

### 3. Project Structure

```
src/
├── App.jsx              # Main application component with authentication logic
├── Login.jsx            # Login and signup components
├── firebase.js          # Firebase configuration and initialization
├── main.jsx             # React entry point
├── index.css            # Global styles (Tailwind CSS)
└── assets/              # Static assets
```

## Key Implementation Details

### Firebase Setup (`src/firebase.js`)

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAN7-gZyqCSn__Frq5YgfR9Z7ucNDNZMWM",
  authDomain: "notice-2eca2.firebaseapp.com",
  projectId: "notice-2eca2",
  storageBucket: "notice-2eca2.firebasestorage.app",
  messagingSenderId: "108701993463",
  appId: "1:108701993463:web:75ab557c841f4b9e08c6f2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const ADMIN_EMAIL = "admin@notices.com";
export { db, auth };
```

### Authentication in App.jsx

- **State Management**: User authentication state is managed using `onAuthStateChanged()`
- **Admin Check**: `isAdmin` is determined by comparing the user's email with the hardcoded `ADMIN_EMAIL`
- **Protected Features**: 
  - "New Notice" button only visible to admins
  - Edit/Delete buttons only visible to admins
  - Form modal only appears for admins

### Login Component (`src/Login.jsx`)

Features:
- Email/password login
- Sign up form with password confirmation
- Password validation (minimum 6 characters)
- Error messages
- Demo credentials display

## Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## User Roles

### Admin User
- Email: `admin@notices.com`
- Permissions: View, Create, Edit, Delete notices
- Visible features: Admin badge, New Notice button, Edit/Delete buttons

### Regular User
- Email: Any other email
- Permissions: View notices only
- Visible features: Notices feed only

## Security Notes

1. **Admin Email**: The admin email (`admin@notices.com`) is hardcoded in the frontend to avoid database queries. In a production environment, consider moving this to Cloud Functions for better security.

2. **Authentication**: Firebase Authentication handles password security. Passwords are never stored as plain text.

3. **Database Rules**: Should be configured in Firebase Console to restrict write access:
   ```
   // Firestore Rules (configure in Firebase Console)
   match /notices/{document=**} {
     allow read: if request.auth != null;
     allow write: if request.auth.token.email == 'admin@notices.com';
   }
   ```

## Technologies Used

- **Frontend**: React 19, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom gradient utilities

## Features Walkthrough

### Creating a Notice (Admin Only)
1. Login with `admin@notices.com`
2. Click "New Notice" button in the header
3. Fill in the notice details:
   - Title
   - Content
   - Category (Announcement, Update, Maintenance, General)
   - Priority (Low, Normal, High)
   - Author name
4. Click "Create Notice"

### Viewing Notices
1. All authenticated users can view the notice board
2. Use the search bar to find specific notices
3. Click "Filter" to view notices by category

### Editing/Deleting (Admin Only)
1. Click the edit (pencil) or delete (trash) icon on a notice card
2. Edit icon: Opens the form to modify the notice
3. Delete icon: Removes the notice from the board

## Troubleshooting

### Issue: "Cannot read property 'email' of null"
- **Solution**: Make sure you're logged in. The app will show a login page if you're not authenticated.

### Issue: "Only admin users can post notices"
- **Solution**: Login with the admin email `admin@notices.com` to post notices.

### Issue: Firebase configuration not found
- **Solution**: Check that `firebase.js` is correctly configured with your Firebase project credentials.

## Future Enhancements

- Add email notifications for new notices
- Implement user roles through Firestore custom claims
- Add attachment support for notices
- Implement notice expiration dates
- Add analytics dashboard for admins
- Multi-language support
