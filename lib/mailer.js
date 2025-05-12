import nodemailer from 'nodemailer';

// Create a transporter using SendGrid
const createTransporter = async () => {
    try {
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY is not configured');
        }
        if (!process.env.SENDGRID_FROM_EMAIL) {
            throw new Error('SENDGRID_FROM_EMAIL is not configured');
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'apikey', // This is always 'apikey' for SendGrid
                pass: process.env.SENDGRID_API_KEY
            },
            tls: {
                rejectUnauthorized: false // Only use this in development
            }
        });

        // Verify the connection configuration
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        return transporter;
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw new Error(`Failed to create email transporter: ${error.message}`);
    }
};

// Test email configuration
export async function testEmailConfig() {
    try {
        const transporter = await createTransporter();
        await transporter.verify();
        console.log('Email configuration is valid');
        return true;
    } catch (error) {
        console.error('Email configuration error:', error);
        return false;
    }
}

export async function sendBookingNotification(booking, event) {
    const { name, email, startTime, endTime, additionalInfo, meetLink } = booking;
    const { title, user } = event;

    // Format the date and time
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const formattedDate = startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    // 生成自定义问题及答案的 HTML
    let answersHtml = '';
    if (booking.answers && typeof booking.answers === 'object' && Object.keys(booking.answers).length > 0) {
        answersHtml = `
        <div style="background-color: #fef9c3; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #fde68a;">
            <h3 style="color: #b45309; margin-top: 0; font-size: 18px;">Additional Questions & Answers</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${Object.entries(booking.answers).map(([q, a]) => `
                    <li style="margin-bottom: 10px;">
                        <span style="font-weight: bold;">${q}</span><br/>
                        <span style="color: #374151;">${a || '-'}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        `;
    }

    const mailOptions = {
        from: {
            name: 'Schedulrr',
            address: process.env.SENDGRID_FROM_EMAIL
        },
        to: user.email,
        subject: `New Booking: ${title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 24px;">New Booking Notification</h1>
                    <p style="color: #4b5563; margin-top: 10px;">Someone has booked your event "${title}"</p>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1e40af; margin-top: 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Booking Details</h2>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 15px; display: flex; align-items: center;">
                            <span style="font-weight: bold; min-width: 120px;">Name:</span>
                            <span style="color: #374151;">${name}</span>
                        </li>
                        <li style="margin-bottom: 15px; display: flex; align-items: center;">
                            <span style="font-weight: bold; min-width: 120px;">Email:</span>
                            <span style="color: #374151;">${email}</span>
                        </li>
                        <li style="margin-bottom: 15px; display: flex; align-items: center;">
                            <span style="font-weight: bold; min-width: 120px;">Date:</span>
                            <span style="color: #374151;">${formattedDate}</span>
                        </li>
                        <li style="margin-bottom: 15px; display: flex; align-items: center;">
                            <span style="font-weight: bold; min-width: 120px;">Time:</span>
                            <span style="color: #374151;">${formattedTime}</span>
                        </li>
                        ${additionalInfo ? `
                        <li style="margin-bottom: 15px; display: flex; align-items: flex-start;">
                            <span style="font-weight: bold; min-width: 120px;">Additional Info:</span>
                            <span style="color: #374151;">${additionalInfo}</span>
                        </li>
                        ` : ''}
                    </ul>
                </div>
                ${answersHtml}

                ${meetLink ? `
                <div style="background-color: #e0f2fe; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #0369a1; margin-top: 0; font-size: 18px;">Meeting Link</h3>
                    <a href="${meetLink}" 
                       style="display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                        Join Meeting
                    </a>
                </div>
                ` : ''}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
                    <p style="margin: 0;">This is an automated message from Schedulrr. Please do not reply to this email.</p>
                    <p style="margin: 10px 0 0 0;">You can view all your bookings in your dashboard.</p>
                </div>
            </div>
        `,
    };

    try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log('Booking notification email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending booking notification email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
} 