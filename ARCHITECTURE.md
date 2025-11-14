# Feature Overview & Architecture

## Application Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Visits App                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Check Auth State   │
            │ (onAuthStateChanged)
            └────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ▼ Authenticated    Not Authenticated ▼
   │                          │
   ├──────────────┐          ┌──────────────┐
   │              │          │              │
   ▼              ▼          │              ▼
Check if      Load         Show Login      (See below)
Admin User    Notices      Page
   │              │          │
   ├──────┬───────┘          │
   │      │                  │
User?  Yes │ Admin?        ┌─┴─────────┐
│          │               │           │
│     Display:         Sign up    or  Login
│  • Admin badge    (Create new    (Existing
│  • New Notice      account)       user)
│  • Edit/Delete              │
│    buttons              ┌───┴─────────┐
│                         │             │
▼                         ▼             ▼
Display:            Set Auth State   Set Auth State
• Notice feed       (user data)      (user data)
• Search bar        │                │
• Filters        ───┴────────────────┴───
                    │
                    └──► Back to Start
                         (Authenticated)
```

## Component Architecture

```
App.jsx (Main Component)
├── Auth State Management
│   ├── user (current user)
│   ├── isAdmin (boolean)
│   └── authLoading (loading state)
│
├── Conditional Rendering
│   ├── Loading State
│   ├── Login Component (if not authenticated)
│   └── Notice Board (if authenticated)
│
├── Subcomponents
│   ├── Header
│   │   ├── Admin Badge (if admin)
│   │   ├── New Notice Button (if admin)
│   │   ├── User Email
│   │   └── Logout Button
│   │
│   ├── Search & Filter Panel
│   │   ├── Search Input
│   │   └── Filter Dropdown
│   │
│   ├── Notice Grid
│   │   └── Notice Cards (with Edit/Delete if admin)
│   │
│   └── Notice Form Modal (if admin && showForm)
│       ├── Title Input
│       ├── Content Input
│       ├── Category Select
│       ├── Priority Select
│       └── Submit/Cancel Buttons
│
└── Connected Services
    └── Firebase
        ├── Authentication
        ├── Firestore (Real-time)
        └── Cloud Storage (ready for expansion)


Login.jsx (Authentication Component)
├── Login Form
│   ├── Email Input
│   ├── Password Input
│   └── Login Button
│
└── Signup Form
    ├── Email Input
    ├── Password Input
    ├── Confirm Password Input
    └── Create Account Button


firebase.js (Configuration)
├── Firebase App Init
├── Firestore Instance
├── Auth Instance
└── ADMIN_EMAIL Constant
```

## Data Flow

### Notice Creation (Admin)
```
Admin clicks "New Notice"
    ↓
Form opens with empty fields
    ↓
Admin fills and submits form
    ↓
handleSubmit() checks isAdmin
    ↓
Calls addDoc() to Firestore
    ↓
onSnapshot listener detects change
    ↓
Notices state updates
    ↓
UI re-renders with new notice
```

### User Authentication
```
User submits login/signup form
    ↓
Firebase authenticates credentials
    ↓
Auth state changes
    ↓
onAuthStateChanged() triggered
    ↓
Sets user state
    ↓
Computes isAdmin (email check)
    ↓
Conditional render based on auth state
    ↓
User sees either login page or notice board
```

### Notice Deletion (Admin)
```
Admin clicks delete icon
    ↓
handleDelete() called
    ↓
Checks isAdmin
    ↓
Calls deleteDoc() on Firestore
    ↓
Firestore updates real-time listeners
    ↓
Notices state updates
    ↓
UI removes notice card
```

## User Journey Maps

### Admin User Journey
```
1. Visit App → See Login Page
2. Sign Up with admin@notices.com → Account Created
3. Login → Redirected to Notice Board
4. See Admin Badge → Confirms Admin Role
5. See New Notice Button → Can create notices
6. Create Notice → Notice appears in feed
7. See Edit/Delete buttons → Can modify notices
8. Click Logout → Return to Login
```

### Regular User Journey
```
1. Visit App → See Login Page
2. Sign Up with user@example.com → Account Created
3. Login → Redirected to Notice Board
4. See Notice Feed Only → Can view notices
5. Use Search/Filter → Can find specific notices
6. Try to create notice → Button doesn't exist
7. Can't see Edit/Delete → View-only access
8. Click Logout → Return to Login
```

## State Management

### App-Level State
```javascript
// Authentication
- user: User | null
- isAdmin: boolean
- authLoading: boolean

// UI
- notices: Notice[]
- showForm: boolean
- editingNotice: Notice | null
- showFilters: boolean

// Form
- formData: {
    title: string
    content: string
    category: string
    priority: string
    author: string
  }

// Search/Filter
- searchTerm: string
- selectedCategory: string
```

## Real-time Features

### Firestore Listeners
```
onSnapshot(notices collection)
    ↓
Watches for changes
    ↓
Detects: add, modify, delete operations
    ↓
Updates local notices state
    ↓
Triggers UI re-render
    ↓
Users see changes immediately
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│         Client Side (React)              │
│                                         │
│  Email Check → isAdmin = (email === ADMIN_EMAIL)
│       ↓                                  │
│  Show/Hide Buttons Based on isAdmin     │
│       ↓                                  │
│  Prevent Form Submission if !isAdmin    │
│                                         │
└──────────────────┬──────────────────────┘
                   │ (Authenticated Request)
                   ▼
┌──────────────────────────────────────────┐
│    Firebase (Secure Backend)              │
│                                          │
│  1. User Authentication                  │
│     - Password hashing (Firebase)        │
│     - Session management                 │
│                                          │
│  2. Firestore (Future Security)          │
│     - Rules should check: email          │
│     - Only admin@notices.com can write   │
│                                          │
└──────────────────────────────────────────┘
```

## Feature Matrix

| Feature | Admin | Regular User |
|---------|-------|--------------|
| View Notices | ✅ | ✅ |
| Search Notices | ✅ | ✅ |
| Filter by Category | ✅ | ✅ |
| Create Notice | ✅ | ❌ |
| Edit Notice | ✅ | ❌ |
| Delete Notice | ✅ | ❌ |
| See Admin Badge | ✅ | ❌ |
| See New Notice Button | ✅ | ❌ |
| See Edit/Delete Buttons | ✅ | ❌ |
| Login/Logout | ✅ | ✅ |

## Firestore Database Structure

```
Firebase Project: notice-2eca2
│
├── Collection: notices
│   ├── Document: {auto-generated id}
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── category: string (general|announcement|update|maintenance)
│   │   ├── priority: string (low|normal|high)
│   │   ├── author: string
│   │   ├── date: timestamp
│   │   └── read: boolean
│   │
│   ├── Document: {auto-generated id}
│   │   └── ... (same structure)
│   │
│   └── ... (more notices)
│
└── Authentication
    └── Users managed by Firebase Auth
        └── Email: admin@notices.com (admin)
        └── Email: user@example.com (regular user)
        └── ... (more users)
```

## Configuration

### Admin Identification
```javascript
// In firebase.js
ADMIN_EMAIL = "admin@notices.com"

// In App.jsx
const isAdmin = user?.email === ADMIN_EMAIL
```

This approach:
- ✅ No database queries needed
- ✅ Fast permission checks
- ✅ Easy to change admin email
- ⚠️ Should be moved to Cloud Functions in production

## Deployment Readiness

### Before Deploying to Production
1. **Firestore Rules**: Restrict write access to admin email
2. **Admin Verification**: Consider Cloud Functions
3. **Error Tracking**: Set up Sentry or similar
4. **Monitoring**: Firebase Console Analytics
5. **Backup**: Enable Firestore backups
6. **HTTPS**: Enable on custom domain

### Environment Configuration
```
Development:
- Local testing with demo accounts
- Hot reload with Vite

Production:
- Real user authentication
- Stricter security rules
- Email verification
- Rate limiting
```

---

This architecture provides a secure, scalable foundation for your notice board application!
