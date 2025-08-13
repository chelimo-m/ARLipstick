# Email Setup Guide

To enable email functionality for sending verification codes, you need to configure the following environment variables:

## Environment Variables

Add these to your `.env.local` file:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Gmail Setup (Recommended for Development)

1. **Enable 2-Step Verification** on your Google Account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter a name like "Joanna K Cosmetics"
   - Copy the generated 16-character password
3. **Use the App Password** in your `EMAIL_PASS` environment variable

## Alternative Email Services

### SendGrid (Recommended for Production)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=your-verified-sender@yourdomain.com
```

### AWS SES
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
EMAIL_FROM=your-verified-sender@yourdomain.com
```

## Testing Email Configuration

1. Set up your environment variables
2. Restart your development server
3. Try sending a verification code
4. Check the console logs for email status

## Fallback Behavior

If email configuration is not set up:
- Verification codes will be logged to the console
- The application will continue to work normally
- Users will see the code in the browser console (development mode only)

## Security Notes

- Never commit your email credentials to version control
- Use environment variables for all sensitive information
- Consider using a dedicated email service for production
- Regularly rotate your email passwords/API keys 