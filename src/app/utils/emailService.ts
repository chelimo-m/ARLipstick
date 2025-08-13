import nodemailer from "nodemailer";

interface EmailConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

class EmailService {
	private transporter: nodemailer.Transporter | null = null;

	constructor() {
		this.initializeTransporter();
	}

	private initializeTransporter() {
		// For development, we'll use a test account or Gmail
		// In production, you should use a proper email service like SendGrid, AWS SES, etc.

		const emailConfig: EmailConfig = {
			host: process.env.EMAIL_HOST || "smtp.gmail.com",
			port: parseInt(process.env.EMAIL_PORT || "587"),
			secure: process.env.EMAIL_SECURE === "true",
			auth: {
				user: process.env.EMAIL_USER || "",
				pass: process.env.EMAIL_PASS || "",
			},
		};

		// Only create transporter if we have email credentials
		if (emailConfig.auth.user && emailConfig.auth.pass) {
			this.transporter = nodemailer.createTransport(emailConfig);
		}
	}

	async sendEmail(options: SendEmailOptions): Promise<boolean> {
		try {
			if (!this.transporter) {
				console.log("Email service not configured. Skipping email send.");
				return false;
			}

			const mailOptions = {
				from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
				to: options.to,
				subject: options.subject,
				html: options.html,
			};

			await this.transporter.sendMail(mailOptions);
			console.log(`Email sent successfully to ${options.to}`);
			return true;
		} catch (error) {
			console.error("Failed to send email:", error);
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
}

// Create a singleton instance
const emailService = new EmailService();

export default emailService;
