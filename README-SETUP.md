# Supabase Setup for Todo App

This guide will help you set up the Supabase backend for your Todo app.

## Connection Details

The app is configured to use the following Supabase project:

- **Project URL:** https://aonlvdzdlmzzxaswikvc.supabase.co
- **API Key:** Already configured in the app

## Database Setup

You need to create the necessary database tables in your Supabase project. You can do this in two ways:

### Option 1: Using the SQL Editor in Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor section
4. Copy the contents of `scripts/setupDatabaseSQL.sql` from this repository
5. Paste it into a new SQL query in the SQL Editor and run it

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.aonlvdzdlmzzxaswikvc.supabase.co:5432/postgres
```

## Authentication Setup

The app uses email/password authentication. Follow these steps to set it up:

1. **Email Authentication Configuration**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Configure the following settings:
     - **Enable Email Signup**: Yes
     - **Enable Email Confirmations**: No (for simplified registration)
     - **Secure Email Change**: Yes
     - **Custom Email Templates**: Optional (you can customize the email templates if needed)

## Testing the Connection

You can test your connection by running:

```bash
npx ts-node scripts/testConnection.ts
```

This will verify that your app can connect to Supabase and that authentication is working.

## Troubleshooting

### Common Issues:

1. **Authentication Errors**: Make sure your email provider is correctly set up
2. **Database Errors**: Ensure the SQL script ran successfully
3. **Policy Errors**: Check that Row Level Security policies are correctly configured
4. **Deep Link Issues**: Verify that your URL scheme is correctly set up in `app.json`

If you continue to have issues, check the Supabase logs in the dashboard under "Logs" for more details.

## Next Steps

Once setup is complete, you can run the app and test the authentication flow:

```bash
npm start
```

The app should now be able to authenticate users with email/password and store tasks in the cloud.
