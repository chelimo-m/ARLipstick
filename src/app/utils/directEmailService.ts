import nodemailer from "nodemailer";

interface EmailData {
	to: string;
	subject: string;
	html: string;
	from?: string;
}

class DirectEmailService {
	private transporter: nodemailer.Transporter | null = null;

	constructor() {
		this.initializeTransporter();
	}

	private initializeTransporter() {
		const emailConfig = {
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			auth: {
				user: process.env.EMAIL_SENDER,
				pass: process.env.EMAIL_APP_PASSWORD,
			},
		};

		if (emailConfig.auth.user && emailConfig.auth.pass) {
			this.transporter = nodemailer.createTransport(emailConfig);
			console.log("Direct email service initialized with Gmail");
		} else {
			console.log(
				"Email configuration not found. Emails will be logged to console."
			);
		}
	}

	async sendEmail(emailData: EmailData): Promise<boolean> {
		try {
			if (!this.transporter) {
				console.log("Email not sent - no transporter configured");
				return false;
			}

			const mailOptions = {
				from:
					emailData.from ||
					process.env.EMAIL_SENDER ||
					"noreply@joannakcosmetics.com",
				to: emailData.to,
				subject: emailData.subject,
				html: emailData.html,
			};

			await this.transporter.sendMail(mailOptions);
			console.log(`Email sent successfully to ${emailData.to}`);
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
		const html = this.generateVerificationEmailHTML(email, code, type);
		return this.sendEmail({ to: email, subject, html });
	}

	private generateVerificationEmailHTML(
		email: string,
		code: string,
		type: string
	): string {
		return `
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
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .code {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #ec4899;
            margin: 20px 0;
            letter-spacing: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
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
          <p>You've requested a ${type} verification code for your Joanna K Cosmetics account.</p>
          <p>Please use the following code to complete your ${type}:</p>
          <div class="code">${code}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>The Joanna K Cosmetics Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 Joanna K Cosmetics. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
	}
}

const directEmailService = new DirectEmailService();
export default directEmailService;
