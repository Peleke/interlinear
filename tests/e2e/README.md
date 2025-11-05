# E2E Tests Setup

## Prerequisites

Before running E2E tests, you need to set up a test user account.

### Option 1: Use Environment Variables

Create a `.env.test.local` file in the project root with test user credentials:

```bash
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=YourSecurePassword123!
```

### Option 2: Use Default Credentials

The tests will use default credentials if environment variables are not set:
- Email: `test@example.com`
- Password: `TestPassword123!`

**Important:** Make sure this user exists in your database with these credentials.

## Creating a Test User

**IMPORTANT:** You MUST create a test user before running E2E tests.

The auth setup is currently failing with "Invalid login credentials" because the test user doesn't exist.

### Quick Setup (Recommended):

1. **Via Signup Page:**
   - Start the dev server: `npm run dev`
   - Visit http://localhost:3000/signup
   - Create an account with these credentials:
     - Email: `test@example.com`
     - Password: `TestPassword123!`
   - If email verification is required, verify the email

2. **Via Direct Database Insert:**
   - Use your database admin tool (Supabase dashboard, pgAdmin, etc.)
   - Create a user with email `test@example.com`
   - Set password hash for `TestPassword123!`

3. **Via Seed Script (TODO):**
   - Create a seed script that sets up test users (recommended for CI/CD)
   - This is the long-term solution for automated testing

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/courses/lesson-completion.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

## How Authentication Works

1. The `auth.setup.ts` file runs first as a dependency
2. It logs in with the test user credentials
3. It saves the authentication state to `.auth/user.json`
4. All other tests use this saved authentication state
5. Tests run with an authenticated session automatically

## Troubleshooting

### Tests failing with "Welcome Back" login page

This means authentication setup failed. Check:
- Test user credentials are correct
- User exists in the database
- User's email is verified (if required)
- Application is running on http://localhost:3000

### Authentication state expired

Delete the `.auth` directory and re-run tests:
```bash
rm -rf .auth
npx playwright test
```
