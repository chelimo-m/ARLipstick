import { getFirebaseAdmin } from "../firebaseAdmin";

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

class FirebaseEmailService {
  private firebaseApp: any;

  constructor() {
    this.firebaseApp = getFirebaseAdmin();
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.firebaseApp) {
        console.log("Firebase Admin not initialized. Skipping email send.");
        return false;
      }

      // Store email data in Firestore for processing by Cloud Functions
      const emailDoc = await this.firebaseApp
        .firestore()
        .collection("emailQueue")
        .add({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          from: emailData.from || "noreply@joannakcosmetics.com",
          status: "pending",
          createdAt: new Date().toISOString(),
          attempts: 0,
          maxAttempts: 3,
        });

      console.log(`Email queued for sending to ${emailData.to} with ID: ${emailDoc.id}`);
      return true;
    } catch (error) {
      console.error("Failed to queue email:", error);
      return false;
    }
  }

  async sendVerificationCode(
    email: string,
    code: string,
    type: "login" | "registration"
  ): Promise<boolean> {
    const subject = `${
      type === "login" ? "Login" : "Registration"
    } Verification Code - Joanna K Cosmetics`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .code {
            background: white;
            border: 2px solid #ec4899;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            color: #ec4899;
            letter-spacing: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Joanna K Cosmetics</h1>
          <p>Premium Cosmetics & Virtual Try-On</p>
        </div>
        
        <div class="content">
          <h2>Your Verification Code</h2>
          <p>Hello!</p>
          <p>You requested a ${
            type === "login" ? "login" : "registration"
          } verification code for your Joanna K Cosmetics account.</p>
          
          <div class="code">${code}</div>
          
          <p>Please enter this 6-digit code in the verification field to complete your ${
            type === "login" ? "login" : "registration"
          }.</p>
          
          <div class="warning">
            <strong>Important:</strong>
            <ul>
              <li>This code will expire in 10 minutes</li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Joanna K Cosmetics Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent to ${email}</p>
          <p>&copy; 2024 Joanna K Cosmetics. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  // Alternative: Use Firebase Auth built-in email templates
  async sendVerificationEmailViaAuth(email: string): Promise<boolean> {
    try {
      if (!this.firebaseApp) {
        console.log("Firebase Admin not initialized.");
        return false;
      }

      // Generate a verification link using Firebase Auth
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        handleCodeInApp: true,
      };

      // This would require the user to be created first
      // For now, we'll use the queue approach above
      console.log("Firebase Auth email verification would be sent to:", email);
      return true;
    } catch (error) {
      console.error("Failed to send Firebase Auth email:", error);
      return false;
    }
  }
}

// Create a singleton instance
const firebaseEmailService = new FirebaseEmailService();

export default firebaseEmailService; 