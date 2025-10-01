## Gladiators Frontend-Domination – Authentication Explained (Simple Guide)

This guide explains how sign‑in, profile completion, and protected pages work. It uses plain language and a diagram. You’ll also find the folder structure and API cheatsheet.

### What happens when a user signs in?
1) User clicks “Sign in with Google” on the frontend (Firebase).
2) Firebase returns an ID token to the browser.
3) The frontend sends that token to the backend on every request (Axios interceptor adds `Authorization: Bearer <token>`).
4) The backend verifies the token with Firebase Admin and knows who the user is.
5) The backend:
   - Creates/updates a `User` document (basic info).
   - Checks if a `Profile` exists for this user to decide if the profile is complete.
6) If no profile exists, the app redirects the user to the Register Profile page.

### Flowchart (high level)
```mermaid
flowchart TD
  A[User clicks Google Sign-In] --> B[Firebase returns ID Token]
  B --> C[Axios interceptor adds Authorization header]
  C --> D[POST /api/users/login]
  D --> E{Verify Firebase token?}
  E -- No --> X[401/403 Error]
  E -- Yes --> F[Upsert User]
  F --> G[GET /api/users/me]
  G --> H{Profile exists?}
  H -- No --> I[/register-profile/]
  H -- Yes --> J[/ (home) & protected pages/]
  I --> K[POST /api/users/register]
  K --> L[Create/Update Profile, compute BMI]
  L --> J
```

### Folder structure (key parts)
```
backend/
  auth/
    verifyFirebaseToken.js      # Express middleware: verifies Firebase ID tokens
  models/
    User.js                     # User { uid, name, email, photo, profileCompleted }
    Profile.js                  # Profile { uid, phone, dob, gender, weight, height, bmi, ... }
  routes/
    userRoutes.js               # /login, /me, PUT /profile
    userRegistrationRoute.js    # POST /register (creates/updates Profile)
    recipeRoutes.js             # Example protected feature route
  firebaseAdmin.js              # Firebase Admin initialization
  server.js                     # Express app bootstrap

RecipeMakerProject/
  src/
    utils/axiosInstance.js      # Adds Firebase ID token to requests
    hooks/useAuth.js            # Listens to Firebase auth; calls /login
    App.jsx                     # Route guards (ProtectedRoute, RequireCompletedProfile)
    pages/
      LoginPage.jsx             # Triggers Firebase sign-in, redirects based on /me
      RegisterProfile.jsx       # Submits full profile; redirects to /profile
      UserProfile.jsx           # Shows profile; refetches on window focus
```

### Environment (backend/.env)
```
PORT=5000
MONGO_URI=<mongodb-connection-string>
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_CLIENT_EMAIL=<firebase-admin-sdk-client-email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<key_lines_with_\\n>\n-----END PRIVATE KEY-----\n"
```
Tip: On Windows, keep literal `\n` in the private key. The code converts them at runtime.

### Data model (simple)
- User (Mongo: `users`)
  - `uid` (unique), `name`, `email` (unique), `photo`, `profileCompleted`
- Profile (Mongo: `profiles`)
  - `uid` (unique), `dob`, `phone`, `gender`, `weight`, `height`, `bmi`, `bloodGroup`, `medicalHistory`, `dailyCalories`, `goalStatus`

### API endpoints (quick reference)
- POST `/api/users/login` (auth)
  - Upserts User from Firebase claims; returns `{ user, profileCompleted }`.
- GET `/api/users/me` (auth)
  - Returns `{ user, profile, profileCompleted }` where `profile.age` is computed from `dob`.
- POST `/api/users/register` (auth)
  - Creates/updates Profile with submitted fields; computes BMI; returns `{ profile, profileCompleted: true }`.
- PUT `/api/users/profile` (auth)
  - Updates Profile (same fields as register) and returns `{ profile, profileCompleted: true }`.

### How redirects are decided (frontend)
- After sign-in, we check `/api/users/me`.
- If `profileCompleted` is false → redirect to `/register-profile`.
- After successful register → redirect to `/profile`.
- Main routes (`/`, `/recipes`, `/community`, `/profile`) are wrapped with a guard that re-checks `/me`.

### Test with curl (replace `<TOKEN>`)
```
curl -H "Authorization: Bearer <TOKEN>" -X POST http://localhost:5000/api/users/login | cat
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/users/me | cat
curl -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","photo":"https://...","dob":"1990-01-01","phone":"123","gender":"Female","weight":60,"height":165,"bloodGroup":"O+","medicalHistory":"","dailyCalories":"1800 kcal","goalStatus":"On Track"}' \
  http://localhost:5000/api/users/register | cat
```

### Troubleshooting (plain language)
- 401/403: Usually means the token is missing/expired. Make sure you’re signed in and the Axios interceptor is running.
- Duplicate key errors on `uid`/`email`: We upsert to avoid this. If you already have duplicates from old data, remove extras manually.
- Private key newline issues: Keep `\n` in `.env` for Windows.

### Security tips
- Verify the token on every protected route (we already do).
- Never trust a `uid` coming from the client; use `req.user.uid` from the verified token.
- Use HTTPS in production.


