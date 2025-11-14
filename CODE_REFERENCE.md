# Code Reference Guide

## Files Modified & Created

### 1. **src/firebase.js** (MODIFIED)

```javascript
// Added imports
import { getAuth } from "firebase/auth";

// Added exports
export const ADMIN_EMAIL = "admin@notices.com";
export { db, auth };
```

**Key Changes**:
- Added `getAuth()` initialization
- Exported `auth` instance for use in components
- Added hardcoded `ADMIN_EMAIL` constant

---

### 2. **src/Login.jsx** (NEW FILE)

**Main Function**: `Login({ onLoginSuccess })`
- Handles user login form
- Switches between login and signup views
- Uses Firebase authentication

**Sub-component**: `SignupForm({ onSignupSuccess, onBackToLogin })`
- Handles user registration
- Password validation
- Email validation

**Key Features**:
- Email/password authentication
- Error handling and display
- Password confirmation
- Minimum 6 character validation
- Demo credentials display

**Functions**:
```javascript
handleLogin(e)      // Submit login form
handleSignup(e)     // Submit signup form
setShowSignup()     // Toggle signup view
```

---

### 3. **src/App.jsx** (MODIFIED)

**State Variables Added**:
```javascript
const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(false);
const [authLoading, setAuthLoading] = useState(true);
```

**New Effects**:
```javascript
// Check authentication status on mount
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setIsAdmin(currentUser?.email === ADMIN_EMAIL);
    setAuthLoading(false);
  });
  return () => unsubscribe();
}, []);
```

**New Functions**:
```javascript
handleLogout()         // Signs out user
handleFormCancel()     // Closes form and resets state
```

**Modified Functions**:
```javascript
handleSubmit()    // Now checks isAdmin before creating notice
handleEdit()      // Now checks isAdmin before allowing edit
handleDelete()    // Now checks isAdmin before deleting
```

**Conditional Rendering**:
```javascript
// Show loading spinner
if (authLoading) { return <LoadingSpinner /> }

// Show login if not authenticated
if (!user) { return <Login /> }

// Show notice board if authenticated
return <NoticeBoard />
```

**UI Updates**:
- Admin badge display (when isAdmin)
- User email in header
- Logout button in header
- "New Notice" button only for admins
- Edit/Delete buttons only for admins
- Form modal only opens for admins

---

## Import Statements

### src/App.jsx
```javascript
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from './firebase';
import Login from './Login';
```

### src/Login.jsx
```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
```

### src/firebase.js
```javascript
import { getAuth } from "firebase/auth";
```

---

## Key Constants

### Admin Email (firebase.js)
```javascript
export const ADMIN_EMAIL = "admin@notices.com";
```

### Form Categories (App.jsx)
```javascript
const categories = [
  { value: 'all', label: 'All Categories', color: 'gray' },
  { value: 'announcement', label: 'Announcement', color: 'blue' },
  { value: 'update', label: 'Update', color: 'green' },
  { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  { value: 'general', label: 'General', color: 'purple' }
];
```

### Priorities (App.jsx)
```javascript
const priorities = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'red' }
];
```

---

## Authentication Flow

### Login Flow
```
User clicks "Sign In" button
    ↓
Calls handleLogin(e)
    ↓
signInWithEmailAndPassword(auth, email, password)
    ↓
Firebase validates credentials
    ↓
onAuthStateChanged() fires
    ↓
Sets user state
    ↓
App re-renders (shows notice board)
```

### Signup Flow
```
User clicks "Create Account" button
    ↓
Calls handleSignup(e)
    ↓
Validates password match
    ↓
createUserWithEmailAndPassword(auth, email, password)
    ↓
Firebase creates account
    ↓
onAuthStateChanged() fires
    ↓
Sets user state
    ↓
App re-renders (shows notice board)
```

### Logout Flow
```
User clicks logout button
    ↓
Calls handleLogout()
    ↓
signOut(auth)
    ↓
Firebase clears session
    ↓
onAuthStateChanged() fires with null
    ↓
setUser(null)
    ↓
App re-renders (shows login page)
```

---

## Admin Check Implementation

### Determining Admin Status
```javascript
// In App.jsx, within onAuthStateChanged callback:
setIsAdmin(currentUser?.email === ADMIN_EMAIL);

// Result:
if (user?.email === "admin@notices.com") {
  isAdmin = true
} else {
  isAdmin = false
}
```

### Using Admin Status
```javascript
// Check before posting
if (!isAdmin) {
  alert('Only admin users can post notices');
  return;
}

// Conditional rendering
{isAdmin && <button onClick={() => setShowForm(true)}>New Notice</button>}

// Conditional UI
{isAdmin && <div className="bg-amber-100">Admin</div>}
```

---

## Form Handling

### Opening Form (Admin Only)
```javascript
// In header
{isAdmin && (
  <button onClick={() => setShowForm(true)}>
    New Notice
  </button>
)}
```

### Submitting Form
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isAdmin) {
    alert('Only admin users can post notices');
    return;
  }
  
  try {
    if (editingNotice) {
      // Update existing notice
      await updateDoc(doc(db, 'notices', editingNotice.id), {...});
    } else {
      // Create new notice
      await addDoc(collection(db, 'notices'), {...});
    }
    
    // Reset form
    setFormData({...});
    setShowForm(false);
  } catch (error) {
    console.error("Error: ", error);
  }
};
```

### Closing Form
```javascript
const handleFormCancel = () => {
  setShowForm(false);
  setEditingNotice(null);
  setFormData({...initialData...});
};
```

---

## Component Visibility Logic

### Header Section
```javascript
<header>
  <div className="flex items-center justify-between">
    {/* Logo - always visible */}
    
    <div className="flex items-center space-x-4">
      {/* Admin Badge - only if admin */}
      {isAdmin && <div className="...">Admin</div>}
      
      {/* New Notice Button - only if admin */}
      {isAdmin && <button>New Notice</button>}
      
      {/* User Email - always visible if logged in */}
      <span>{user?.email}</span>
      
      {/* Logout Button - always visible if logged in */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  </div>
</header>
```

### Notice Cards
```javascript
{filteredNotices.map(notice => (
  <div key={notice.id}>
    {/* Notice content - always visible */}
    
    {/* Edit/Delete buttons - only if admin */}
    {isAdmin && (
      <div>
        <button onClick={() => handleEdit(notice)}>Edit</button>
        <button onClick={() => handleDelete(notice.id)}>Delete</button>
      </div>
    )}
  </div>
))}
```

---

## Error Messages

### Authentication Errors
```javascript
// Invalid credentials
"Firebase: Error (auth/user-not-found)."
"Firebase: Error (auth/wrong-password)."

// Email already exists
"Firebase: Error (auth/email-already-in-use)."

// Weak password
"Firebase: Error (auth/weak-password)."

// Invalid email
"Firebase: Error (auth/invalid-email)."
```

### Validation Errors
```javascript
// Password mismatch
"Passwords do not match"

// Short password
"Password must be at least 6 characters"

// Missing fields
"[field] is required"
```

### Authorization Errors
```javascript
// Non-admin trying to post
"Only admin users can post notices"

// Non-admin trying to edit
"Only admin users can edit notices"

// Non-admin trying to delete
"Only admin users can delete notices"
```

---

## Testing Checklist

### Unit Tests (Manual)
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Signup with new email
- [ ] Signup with existing email
- [ ] Signup with weak password
- [ ] Logout functionality
- [ ] Admin detection (admin@notices.com)
- [ ] Regular user detection (other emails)

### Integration Tests
- [ ] Admin can create notice
- [ ] Regular user cannot create notice
- [ ] Admin can edit notice
- [ ] Regular user cannot edit notice
- [ ] Admin can delete notice
- [ ] Regular user cannot delete notice
- [ ] Notices appear real-time
- [ ] Search works correctly
- [ ] Filter works correctly

### UI Tests
- [ ] Login page displays correctly
- [ ] Signup form displays correctly
- [ ] Admin badge shows for admin
- [ ] Admin badge hidden for regular users
- [ ] New Notice button shows for admin
- [ ] New Notice button hidden for regular users
- [ ] Edit/Delete buttons show for admin
- [ ] Edit/Delete buttons hidden for regular users
- [ ] Logout button works
- [ ] Loading spinner shows during auth check

---

## Troubleshooting Reference

### Problem: "Cannot read property 'email' of null"
**Cause**: User object not loaded yet
**Solution**: Add loading check: `if (authLoading) return <Loading />`

### Problem: Non-admin can see form modal
**Cause**: Form guard missing
**Solution**: Check `{showForm && isAdmin && (<form>...)}`

### Problem: Edit/Delete buttons visible to all users
**Cause**: Conditional rendering missing
**Solution**: Wrap in `{isAdmin && (<buttons>...)}`

### Problem: Admin email not recognized
**Cause**: Email case sensitivity
**Solution**: Use exact email or implement case-insensitive check

### Problem: Firebase not initialized
**Cause**: Missing imports
**Solution**: Import from `firebase.js`: `import { db, auth, ADMIN_EMAIL }`

---

## Performance Tips

1. **Memoization**: Use `useCallback` for event handlers
2. **Lazy Loading**: Load notice feed with pagination
3. **Caching**: Use Firestore offline persistence
4. **Search**: Implement client-side search first, then Firestore queries
5. **Real-time Listeners**: Unsubscribe on component unmount

---

This guide covers all the code changes and implementation details!
