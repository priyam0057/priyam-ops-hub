# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for backing up your project data.

## Prerequisites
- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" → "New Project"
3. Enter project name (e.g., "Priyam Project Manager")
4. Click "Create"

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (or Internal if using Google Workspace)
   - App name: Priyam Project Manager
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `https://www.googleapis.com/auth/drive.file`
   - Add test users if using External type

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: Priyam Dashboard
   - Authorized JavaScript origins: Add your app URL
     - For development: `http://localhost:5173`
     - For production: Your deployed URL (e.g., `https://0f252b7b-428f-4c67-85b2-c510cf391593.lovableproject.com`)
   - Authorized redirect URIs: **MUST include /dashboard**
     - For development: `http://localhost:5173/dashboard`
     - For production: `https://0f252b7b-428f-4c67-85b2-c510cf391593.lovableproject.com/dashboard`
   - Click "Create"

5. Copy the **Client ID** (you'll need this)

## Step 4: Configure Your App

1. Open your `.env` file
2. Add the Google Client ID:
   ```
   VITE_GOOGLE_DRIVE_CLIENT_ID="your_client_id_here.apps.googleusercontent.com"
   ```

3. Save the file and restart your development server

## Step 5: Test the Integration

1. Navigate to your Dashboard or any Project Detail page
2. Find the "Google Drive Backups" section
3. Click "Connect Google Drive"
4. Sign in with your Google account
5. Grant permissions to the app
6. You should now see the Google Drive integration connected!

## Features

Once connected, you can:
- ✅ **Upload backups** to Google Drive (stored in "Priyam Backups" folder)
- ✅ **Download backups** from Google Drive
- ✅ **Delete backups** from Google Drive
- ✅ **View all backups** with file sizes and dates

## Troubleshooting

### "Access blocked" or "redirect_uri_mismatch" error
- Go to Google Cloud Console → Credentials
- Edit your OAuth 2.0 Client ID
- Add the EXACT redirect URI with `/dashboard` at the end:
  - Example: `https://0f252b7b-428f-4c67-85b2-c510cf391593.lovableproject.com/dashboard`
- Make sure the URL matches your current app URL exactly
- Save and try connecting again

### "Invalid client ID" error
- Verify the Client ID is correctly copied to `.env`
- Make sure there are no extra spaces or quotes

### Files not showing up
- Check that the Google Drive API is enabled
- Verify you've granted the correct permissions

## Security Notes

⚠️ **Important:**
- The client ID is safe to expose in client-side code
- Never commit the `.env` file to version control
- The app only has access to files it creates
- Users must explicitly grant permission

## Support

For issues or questions, check:
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
