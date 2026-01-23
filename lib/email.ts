// Email service integration
// Supports SendGrid, Mailgun, or AWS SES

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
}

interface EmailService {
    sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// SendGrid implementation
class SendGridService implements EmailService {
    private apiKey: string;
    private fromEmail: string;
    private fromName: string;

    constructor() {
        this.apiKey = process.env.SENDGRID_API_KEY || '';
        this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@techeventx.com';
        this.fromName = process.env.SENDGRID_FROM_NAME || 'TechEventX';
        
        if (!this.apiKey) {
            console.warn('SENDGRID_API_KEY not set. Email service will not work.');
        }
    }

    async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.apiKey) {
            return { success: false, error: 'SendGrid API key not configured' };
        }

        try {
            const sgMail = await import('@sendgrid/mail');
            sgMail.default.setApiKey(this.apiKey);

            const msg = {
                to: options.to,
                from: {
                    email: options.from || this.fromEmail,
                    name: this.fromName,
                },
                subject: options.subject,
                text: options.text || options.html.replace(/<[^>]*>/g, ''),
                html: options.html,
                replyTo: options.replyTo,
                cc: options.cc,
                bcc: options.bcc,
                attachments: options.attachments?.map(att => ({
                    content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
                    filename: att.filename,
                    type: att.contentType,
                    disposition: 'attachment',
                })),
            };

            const [response] = await sgMail.default.send(msg);
            
            return {
                success: response.statusCode >= 200 && response.statusCode < 300,
                messageId: response.headers['x-message-id'] as string,
            };
        } catch (error: any) {
            console.error('SendGrid error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email',
            };
        }
    }
}

// Mailgun implementation
class MailgunService implements EmailService {
    private apiKey: string;
    private domain: string;
    private fromEmail: string;

    constructor() {
        this.apiKey = process.env.MAILGUN_API_KEY || '';
        this.domain = process.env.MAILGUN_DOMAIN || '';
        this.fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@techeventx.com';
        
        if (!this.apiKey || !this.domain) {
            console.warn('MAILGUN_API_KEY or MAILGUN_DOMAIN not set. Email service will not work.');
        }
    }

    async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        if (!this.apiKey || !this.domain) {
            return { success: false, error: 'Mailgun not configured' };
        }

        try {
            // Use URLSearchParams for Mailgun API
            const params = new URLSearchParams();
            params.append('from', options.from || this.fromEmail);
            params.append('to', Array.isArray(options.to) ? options.to.join(',') : options.to);
            params.append('subject', options.subject);
            params.append('html', options.html);
            if (options.text) {
                params.append('text', options.text);
            }
            if (options.replyTo) {
                params.append('h:Reply-To', options.replyTo);
            }

            const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`,
                },
                body: params,
            });

            const data = await response.json();
            
            return {
                success: response.ok,
                messageId: data.id,
                error: data.message,
            };
        } catch (error: any) {
            console.error('Mailgun error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email',
            };
        }
    }
}

// Factory function to get email service
export function getEmailService(): EmailService {
    const provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    
    switch (provider.toLowerCase()) {
        case 'sendgrid':
            return new SendGridService();
        case 'mailgun':
            return new MailgunService();
        default:
            console.warn(`Unknown email provider: ${provider}. Using SendGrid as fallback.`);
            return new SendGridService();
    }
}

const emailService = getEmailService();

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions) {
    return await emailService.sendEmail(options);
}

/**
 * Email templates
 */
export const emailTemplates = {
    bookingConfirmation: (eventTitle: string, eventDate: string, eventTime: string, ticketNumber?: string) => ({
        subject: `Booking Confirmed: ${eventTitle}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Booking Confirmed!</h1>
                    </div>
                    <div class="content">
                        <p>Your booking for <strong>${eventTitle}</strong> has been confirmed!</p>
                        <p><strong>Date:</strong> ${eventDate}</p>
                        <p><strong>Time:</strong> ${eventTime}</p>
                        ${ticketNumber ? `<p><strong>Ticket Number:</strong> ${ticketNumber}</p>` : ''}
                        <p>We look forward to seeing you at the event!</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://techeventx.com'}/bookings" class="button">View My Bookings</a>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    eventReminder: (eventTitle: string, eventDate: string, eventTime: string, hoursUntil: number) => ({
        subject: `Reminder: ${eventTitle} starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Event Reminder</h1>
                    </div>
                    <div class="content">
                        <p>Don't forget! <strong>${eventTitle}</strong> is starting soon.</p>
                        <p><strong>Date:</strong> ${eventDate}</p>
                        <p><strong>Time:</strong> ${eventTime}</p>
                        <p>See you there!</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    welcome: (userName: string) => ({
        subject: 'Welcome to TechEventX!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to TechEventX!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Welcome to TechEventX! We're excited to have you join our community of tech enthusiasts.</p>
                        <p>Start exploring amazing tech events happening around the world.</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://techeventx.com'}/events" class="button">Browse Events</a>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),

    bookingCancellation: (eventTitle: string, eventDate: string, eventTime: string, hasRefund: boolean = false) => ({
        subject: `Booking Cancelled: ${eventTitle}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Booking Cancelled</h1>
                    </div>
                    <div class="content">
                        <p>Your booking for <strong>${eventTitle}</strong> has been cancelled.</p>
                        <p><strong>Date:</strong> ${eventDate}</p>
                        <p><strong>Time:</strong> ${eventTime}</p>
                        ${hasRefund ? '<p><strong>Refund:</strong> A refund has been processed and will be credited to your account within 5-7 business days.</p>' : ''}
                        <p>If you have any questions, please contact our support team.</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://techeventx.com'}/bookings" class="button">View My Bookings</a>
                    </div>
                </div>
            </body>
            </html>
        `,
    }),
};

