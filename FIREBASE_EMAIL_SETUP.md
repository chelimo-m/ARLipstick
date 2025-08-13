# Firebase Email Setup Guide

This guide will help you set up Firebase Cloud Functions to handle email sending for your Joanna K Cosmetics application.

## Overview

We've implemented a Firebase-based email system with the following components:

1. **Firebase Email Service** - Queues emails in Firestore
2. **Cloud Functions** - Processes the email queue and sends emails
3. **Email Queue Collection** - Stores pending emails in Firestore

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project** set up with:
   - Firestore Database
   - Cloud Functions (Blaze plan required)
   - Authentication

## Setup Steps

### 1. Initialize Firebase (if not already done)

```bash
firebase login
firebase init
```

Select the following services:
- Firestore
- Functions
- Emulators (optional, for local development)

### 2. Install Dependencies

```bash
# Install functions dependencies
cd functions
npm install

# Install main project dependencies (if not already done)
cd ..
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Email Configuration (for Cloud Functions)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to Security > 2-Step Verification > App passwords
4. Generate a new app password for "Mail"
5. Use this password in your `EMAIL_PASS` environment variable

### 5. Deploy Cloud Functions

```bash
# Deploy functions to Firebase
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

### 6. Set Environment Variables for Cloud Functions

```bash
# Set environment variables for Cloud Functions
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
firebase functions:config:set email.secure="false"
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-app-password"
firebase functions:config:set email.from="your-email@gmail.com"

# Deploy functions again to apply config
firebase deploy --only functions
```

## How It Works

### Email Flow

1. **User requests verification code** → API route called
2. **Code generated** → Stored in Firestore
3. **Email queued** → Added to `emailQueue` collection
4. **Cloud Function triggered** → Processes email queue
5. **Email sent** → Status updated in Firestore

### Cloud Functions

- **`processEmailQueue`** - Scheduled function that runs every minute to process pending emails
- **`onEmailQueued`** - Triggered when new email is added to queue
- **`sendVerificationCode`** - HTTP callable function for direct email sending

### Email Queue Structure

```javascript
{
  to: "user@example.com",
  subject: "Verification Code",
  html: "<email content>",
  from: "noreply@joannakcosmetics.com",
  status: "pending", // pending, sent, failed
  createdAt: "2024-01-01T00:00:00.000Z",
  attempts: 0,
  maxAttempts: 3,
  sentAt: "2024-01-01T00:00:00.000Z", // if sent
  failedAt: "2024-01-01T00:00:00.000Z", // if failed
  error: "error message" // if failed
}
```

## Testing

### Local Development

1. **Start Firebase Emulators**:
   ```bash
   firebase emulators:start
   ```

2. **Start your Next.js app**:
   ```bash
   npm run dev
   ```

3. **Test email functionality**:
   - Go to `/login`
   - Enter an email address
   - Click "Send Login Code"
   - Check the Firebase Emulator UI for email queue

### Production Testing

1. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

2. **Test with real email**:
   - Use a real email address
   - Check your inbox for the verification code

## Monitoring

### Firebase Console

1. Go to Firebase Console
2. Navigate to Functions to see execution logs
3. Check Firestore to see email queue status

### Logs

```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only processEmailQueue
```

## Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - Check environment variables are set correctly
   - Verify Gmail app password is correct

2. **"Functions deployment failed"**
   - Ensure you're on Blaze plan (required for external API calls)
   - Check function logs for specific errors

3. **"Emails not being sent"**
   - Check Firestore for email queue entries
   - Verify Cloud Functions are deployed and running
   - Check function logs for errors

### Debug Mode

Enable debug logging in your Cloud Functions:

```javascript
// In functions/index.ts
console.log('Email config:', emailConfig);
console.log('Email data:', emailData);
```

## Alternative Email Services

### SendGrid

```bash
# Update environment variables
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### AWS SES

```bash
# Update environment variables
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
```

## Security Considerations

1. **Environment Variables** - Never commit email credentials to version control
2. **Firestore Rules** - Only allow authenticated users to access email queue
3. **Rate Limiting** - Cloud Functions have built-in rate limits
4. **Error Handling** - Failed emails are logged and can be retried

## Cost Considerations

- **Firestore** - $0.18 per 100,000 reads, $0.18 per 100,000 writes
- **Cloud Functions** - $0.40 per million invocations
- **Email Sending** - Depends on your email provider (Gmail is free)

## Next Steps

1. Set up monitoring and alerting for failed emails
2. Implement email templates for different types of emails
3. Add email analytics and tracking
4. Consider using Firebase Extensions for easier setup 