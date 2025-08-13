# Direct Email Setup Guide

## Overview

This guide shows how to set up direct email sending using Nodemailer without requiring Firebase Cloud Functions (which need the Blaze plan).

## Quick Setup

### 1. Add Environment Variables

Add these to your `.env.local` file:

```bash
# =====================
# Email Configuration
# =====================
EMAIL_APP_PASSWORD=ptfx gmfb qmmz xbqi
EMAIL_SENDER=kiruivictor097@gmail.com
```

### 2. Gmail App Password Setup

✅ **Already configured!** Your Gmail app password is set up and ready to use.

If you need to generate a new one in the future:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Joanna K Cosmetics"
   - Copy the generated password
4. Update `EMAIL_APP_PASSWORD` in your `.env.local` file

### 3. Test the Setup

1. Restart your development server
2. Go to `/login`
3. Enter an email address
4. Click "Send Login Code"
5. Check the console for email status

## Email Flow

### Current Implementation

- ✅ **Direct email sending** - No Cloud Functions required
- ✅ **Beautiful email templates** - Joanna K Cosmetics branded
- ✅ **6-box verification input** - Professional UI
- ✅ **Resend functionality** - With cooldown timer
- ✅ **Rate limiting** - Prevents spam

### Email Timing

- **Immediate sending** - No queue delays
- **Real-time delivery** - Direct SMTP connection
- **Fallback logging** - Codes logged to console if email fails

## Troubleshooting

### Common Issues

1. **"Email configuration not found"**

   - Check your `.env.local` file
   - Ensure all email variables are set
   - Restart the development server

2. **"Authentication failed"**

   - Verify your Gmail app password
   - Check if 2FA is enabled
   - Try generating a new app password

3. **"Connection timeout"**
   - Check your internet connection
   - Verify Gmail SMTP settings
   - Try different port (587 or 465)

### Testing Without Email

If you can't set up email immediately:

- Codes are logged to the console in development
- Check the terminal output for verification codes
- The 6-box input and resend functionality still work

## Production Deployment

### Vercel Deployment

1. Add the same environment variables to Vercel
2. Deploy your application
3. Test email functionality

### Alternative Email Services

You can use other SMTP providers:

**SendGrid:**

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

**Mailgun:**

```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

## Security Notes

- ✅ **App passwords** - More secure than regular passwords
- ✅ **Environment variables** - No hardcoded credentials
- ✅ **Rate limiting** - Prevents abuse
- ✅ **Code expiration** - 10-minute timeout

## Cost Comparison

### Free Plan (Current)

- ✅ **No monthly cost**
- ✅ **Unlimited emails** (within provider limits)
- ✅ **Direct SMTP** - No queue processing
- ❌ **Requires email provider setup**

### Blaze Plan (Alternative)

- 💰 **Pay per use** (~$0.40 per million function invocations)
- ✅ **Cloud Functions** - Serverless processing
- ✅ **Email queue** - Reliable delivery
- ✅ **Automatic scaling**

## Next Steps

1. **Set up email configuration**
2. **Test the verification flow**
3. **Deploy to production**
4. **Monitor email delivery**

The direct email approach is perfect for getting started quickly without requiring a paid Firebase plan!
