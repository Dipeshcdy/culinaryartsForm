# ACA Form Creator

React + Firebase app for Academy of Culinary Arts. Admins create forms; the public fills them at `/{formId}`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (ACA brand tokens)
- Firebase Authentication (email/password)
- Cloud Firestore

## Setup

1. Copy env file and fill values from Firebase Console → Project settings → Your apps:

```bash
cp .env.example .env.local
```

2. Install and run:

```bash
npm install
npm run dev
```

3. Open the app (usually `http://localhost:5173`), go to `/login`, and sign in with your Firebase Auth admin user.

### Firebase Console checklist

- Authentication → Email/Password enabled
- Firestore Database created
- Admin user created under Authentication → Users
- Document `admins/{uid}` created (Document ID = the user’s Auth UID), with at least an `email` field

### Firestore security rules

1. Open Firebase Console → Firestore → **Rules**
2. Paste the contents of [`firestore.rules`](./firestore.rules)
3. Publish

Until these rules are published, Production mode defaults will block client reads/writes.

## Routes

| Path | Purpose |
|------|---------|
| `/login` | Admin sign-in |
| `/admin` | Dashboard |
| `/admin/forms` | Form list |
| `/admin/forms/new` | Create form |
| `/admin/forms/:formId` | Edit form |
| `/admin/forms/:formId/submissions` | View answers |
| `/:formId` | Public form (published only) |

## Brand

Colors and logo match [culinaryarts.com.np](https://culinaryarts.com.np/): cream background, burgundy accents, red CTAs, ACA logo in `public/aca-logo.svg`.
