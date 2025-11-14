# Quick Start Guide

## Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5173 (or the URL shown in terminal)
```

## Test Accounts

### Admin Account (Can post updates)
- **Email**: `admin@notices.com`
- **Password**: Any password with minimum 6 characters (e.g., `admin123`)

### Regular User Account (Can only view)
- **Email**: `user@notices.com`
- **Password**: Any password with minimum 6 characters (e.g., `user123`)

## Testing Workflow

### Step 1: Test Admin Features
1. Go to the login page
2. Click "Sign up here"
3. Enter email: `admin@notices.com`
4. Enter password: `admin123`
5. Click "Create Account"
6. You're now logged in as admin
7. You should see:
   - ✅ "Admin" badge in header
   - ✅ "New Notice" button
   - ✅ Edit/Delete buttons on notices

### Step 2: Create a Test Notice
1. Click "New Notice" button
2. Fill in:
   - Title: "Welcome to the Notice Board"
   - Content: "This is a test notice created by admin"
   - Category: "Announcement"
   - Priority: "High"
   - Author: "Admin"
3. Click "Create Notice"
4. Notice should appear at the top of the feed

### Step 3: Edit/Delete Notice
1. Find the notice you created
2. Click the pencil icon to edit
3. Change the content and click "Update Notice"
4. Or click the trash icon to delete

### Step 4: Test Regular User
1. Click logout (door icon in header)
2. Click "Sign up here"
3. Enter email: `user@notices.com`
4. Enter password: `user123`
5. Click "Create Account"
6. You should see:
   - ❌ NO "Admin" badge
   - ❌ NO "New Notice" button
   - ❌ NO Edit/Delete buttons
   - ✅ Only the notice feed

### Step 5: Test Search & Filters
1. Use the search bar to find notices by title or content
2. Click "Filter" button to filter by category

### Step 6: Logout
1. Click the logout button (door icon) in the top right
2. You should return to the login page

## Features Checklist

- [x] Login page with Firebase authentication
- [x] Sign-up form with password validation
- [x] User authentication required to view notices
- [x] Admin-only "New Notice" button (visible only to admin@notices.com)
- [x] Admin-only Edit/Delete functionality
- [x] Admin badge display
- [x] Logout button
- [x] Real-time notice updates
- [x] Search functionality
- [x] Category filter
- [x] Priority badge
- [x] Responsive design

## Troubleshooting

**Q: I see "Only admin users can post notices" error**
A: You need to login with `admin@notices.com` to post notices.

**Q: Edit/Delete buttons don't appear**
A: These buttons only appear when logged in as admin. Login with `admin@notices.com`.

**Q: Cannot sign up with the same email twice**
A: This is normal Firebase behavior. Each email can only have one account. Use different emails for different test users.

**Q: Firebase errors in console**
A: Make sure you have internet connection and that Firebase is properly initialized in `firebase.js`.

## What You Can Customize

### Change Admin Email
- Open `src/firebase.js`
- Change `ADMIN_EMAIL = "admin@notices.com"` to your desired admin email
- You'll need to create an account with that email to be admin

### Change UI Colors
- Most colors use Tailwind CSS gradient-to-r and color classes
- Edit the className values (e.g., `from-blue-500 to-purple-600`)
- See Tailwind CSS documentation for available colors

### Add More Categories/Priorities
- In `App.jsx`, modify the `categories` and `priorities` arrays
- These are used for filtering and badge display

---

**Ready to use!** Start with `npm run dev` and test the features above.
