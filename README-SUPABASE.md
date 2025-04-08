# Setting Up Supabase Authentication and Storage for Your Todo App

This guide walks you through setting up Supabase to handle user authentication and task storage for the application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you haven't already.
2. Create a new project and give it a name.
3. Choose a strong database password and note it down.
4. Select a region closest to your users and click "Create new project".
5. Wait for your database to be set up (this might take a few minutes).

## 2. Get Your API Keys

Once your project is ready:

1. Go to the project dashboard.
2. In the left sidebar, click on the "Settings" gear icon, then navigate to "API".
3. You'll find two important keys:
   - **Project URL**: Your Supabase project URL
   - **anon public** key: The anonymous API key for unauthenticated requests

Copy these values, as you'll need them in the next step.

## 3. Update Your App Configuration

1. Open the `lib/supabase.ts` file in your project.
2. Replace the placeholder values with your actual Supabase credentials:

```typescript
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
```

## 4. Set Up Database Tables

1. In your Supabase dashboard, go to the "SQL Editor" section.
2. Copy the SQL from the `scripts/supabase-setup.sql` file in this project.
3. Paste it into the SQL editor and execute the queries to create the necessary tables and security policies.

## 5. Configure Email Authentication

1. In your Supabase dashboard, go to "Authentication" > "Providers".
2. Enable the "Email" provider for authentication.
3. Configure the following settings:
   - **Enable Email Signup**: Yes
   - **Enable Email Confirmations**: No (for simplified registration)
   - **Secure Email Change**: Yes
   - **Custom Email Templates**: Optional (you can customize the email templates if needed)

## 6. Testing Your Setup

1. Run your app with `npm start` or `expo start`.
2. Try registering a new account with your email and password.
3. Try signing in with your credentials.
4. Check the Supabase "Authentication" > "Users" section to verify the user was created.
5. Try adding a task and verify it appears in the "Database" > "Tables" > "tasks" section.

## Troubleshooting

- **Authentication Issues**: Make sure your API keys are correctly set up and that the Email provider is properly configured.
- **Database Access Issues**: Check the RLS (Row Level Security) policies to ensure they're properly configured.
- **Deep Link Issues**: If deep links aren't working, verify that your URL scheme is correctly set up in `app.json`.

## Security Considerations

- Never expose your service role key in client-side code.
- The anon key is safe to use in client code but has limited permissions.
- All sensitive operations should be secured by Row Level Security policies.
- Consider implementing additional security measures for production environments.
- For production apps, consider enabling email confirmation to verify user identities.

## Next Steps

- Set up backups for your Supabase database.
- Monitor usage to ensure you stay within the free tier limits or upgrade as needed.
- Implement offline support with local caching for a better user experience.
- Consider adding password reset functionality for better user experience.
