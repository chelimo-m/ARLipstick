# 🔥 Firebase Migration Guide

This guide will help you completely change your Firebase configuration to a new project.

## 📋 Prerequisites

- Access to Firebase Console
- Your current project running locally

## 🚀 Step-by-Step Migration

### Step 1: Create New Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create a project"**
3. **Enter project name** (e.g., "ar-lipstick-new")
4. **Choose whether to enable Google Analytics** (optional)
5. **Click "Create project"**

### Step 2: Enable Required Services

#### Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (if needed)

#### Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select **location** (choose closest to your users)

#### Storage

1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select **location**

### Step 3: Get Configuration Values

#### Web App Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** → **Web** (</>)
4. Register app with name (e.g., "AR Lipstick Web")
5. Copy the configuration object

#### Service Account Key

1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Save it as `src/secret/firebase-service-account.json`

### Step 4: Update Environment Variables

1. **Copy the template**: `cp firebase-migration-template.env .env.local`
2. **Edit `.env.local`** with your new values:

```bash
# Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-new-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-new-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-new-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-new-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-new-app-id

# Service Account
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-new-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour long private key here\n-----END PRIVATE KEY-----\n"
```

### Step 5: Update Service Account File

1. **Replace** `src/secret/firebase-service-account.json` with your new service account JSON
2. **Update** the `project_id` in the JSON file to match your new project

### Step 6: Update Firebase Rules

#### Firestore Rules

Update `firestore.rules` if needed for your new project structure.

#### Storage Rules

Update storage rules in Firebase Console if needed.

### Step 7: Test the Migration

1. **Stop your development server** (Ctrl+C)
2. **Clear cache**: `rm -rf .next`
3. **Restart server**: `npm run dev`
4. **Test functionality**:
   - User registration/login
   - Product management
   - AR features
   - File uploads

### Step 8: Deploy to Production

1. **Update Vercel environment variables** with new Firebase config
2. **Deploy**: `vercel --prod`

## 🔧 Troubleshooting

### Common Issues

#### "Firebase initialization failed"

- Check that all environment variables are set correctly
- Verify API keys and project IDs match

#### "Missing required Firebase Admin environment variables"

- Ensure `.env.local` file exists and has correct values
- Check that `FIREBASE_PRIVATE_KEY` includes the full private key with `\n` characters

#### "Permission denied" errors

- Verify Firestore and Storage rules are set to allow read/write
- Check that service account has proper permissions

#### Authentication issues

- Ensure Authentication is enabled in Firebase Console
- Verify sign-in methods are configured

## 📁 Files Modified

- `src/app/firebaseConfig.ts` - Updated with placeholder values
- `src/app/firebaseAdmin.ts` - Updated with placeholder values
- `scripts/cleanup-database.js` - Added TODO comment
- `firebase-migration-template.env` - Created template file

## ✅ Verification Checklist

- [ ] New Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Web app registered
- [ ] Service account key downloaded
- [ ] Environment variables updated
- [ ] Service account JSON file replaced
- [ ] Local development working
- [ ] Production deployment updated

## 🆘 Need Help?

If you encounter issues during migration:

1. Check Firebase Console for error messages
2. Verify all configuration values are correct
3. Ensure environment variables are properly set
4. Test with a simple Firebase connection first
