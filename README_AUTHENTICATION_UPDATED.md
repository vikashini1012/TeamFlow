# TeamFlow Authentication Module

## Implemented

- User registration with validation and bcrypt password hashing.
- Login with JWT authentication.
- Current-user endpoint (`/api/auth/me`).
- Protected frontend routes.
- Logout/token clearing.
- Profile update (name and avatar URL).
- Change password with current-password verification.
- Password reset token generation using cryptographically secure random bytes.
- SHA-256 token hashing in PostgreSQL.
- 30-minute password reset expiry.
- One-time reset token usage.
- Invalidating outstanding password reset tokens after a normal password change.
- Forgot-password frontend flow.
- Reset-password frontend flow.
- Development-only reset token exposure because no email provider is configured.
- Responsive authentication screens.
- Responsive Account/Profile & Security page.
- ProjectDetails-only UI stylesheet isolation so its global `main` selectors no longer break the Account page.

## Database

The Prisma `PasswordResetToken` model and migration are included.

Before running:

```powershell
cd backend
npx prisma generate
npx prisma migrate dev
npm run build
npm run dev
```

Then:

```powershell
cd ../frontend
npm install
npm run build
npm run dev
```

## Important

Production password reset should be connected to an email provider. The current development flow intentionally exposes the reset token in the response so the feature can be tested locally without an email service.
