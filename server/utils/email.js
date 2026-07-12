import nodemailer from 'nodemailer';
import axios from 'axios';

let transporter;

try {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    const isGmail = smtpHost.includes('gmail') || smtpUser.endsWith('@gmail.com');
    
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000
      });
    } else {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000
      });
    }
  } else {
    console.warn('SMTP credentials not fully configured. Using mock console mailer.');
  }
} catch (error) {
  console.error('Failed to configure SMTP transporter:', error);
}

export const sendInviteEmail = async (email, taskTitle, inviteUrl) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    console.log('Using Resend HTTP API to send email...');
    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'TaskPilot <onboarding@resend.dev>',
          to: email,
          subject: `Invitation to complete task: ${taskTitle}`,
          html: `
            <div style="font-family: sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 8px;">
              <h2 style="color: #a855f7;">TaskPilot Invitation</h2>
              <p>You have been invited to complete a candidate task: <strong>${taskTitle}</strong>.</p>
              <p>This is a live-monitored task with real-time AI assistance feedback. You do not need to create an account; simply click the link below to review details and begin.</p>
              <a href="${inviteUrl}" style="display: inline-block; background-color: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Start Task</a>
              <p style="font-size: 12px; color: #71717a;">If the button doesn't work, copy and paste this link in your browser:</p>
              <p style="font-size: 12px; color: #a855f7; word-break: break-all;">${inviteUrl}</p>
            </div>
          `
        },
        {
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`Invite email successfully sent via Resend API to ${email}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to send email to ${email} via Resend:`, error.response?.data || error.message);
    }
  }

  // Fallback to SMTP
  const mailSender = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || '"TaskPilot" <noreply@taskpilot.io>';
  const mailOptions = {
    from: mailSender,
    to: email,
    subject: `Invitation to complete task: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px; border-radius: 8px;">
        <h2 style="color: #a855f7;">TaskPilot Invitation</h2>
        <p>You have been invited to complete a candidate task: <strong>${taskTitle}</strong>.</p>
        <p>This is a live-monitored task with real-time AI assistance feedback. You do not need to create an account; simply click the link below to review details and begin.</p>
        <a href="${inviteUrl}" style="display: inline-block; background-color: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Start Task</a>
        <p style="font-size: 12px; color: #71717a;">If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="font-size: 12px; color: #a855f7; word-break: break-all;">${inviteUrl}</p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Invite email successfully sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send email to ${email} via SMTP:`, error);
      console.log(`[MOCK EMAIL LOG] Send to: ${email} | Subject: ${mailOptions.subject} | URL: ${inviteUrl}`);
    }
  } else {
    console.log(`[MOCK EMAIL LOG] Send to: ${email} | Subject: ${mailOptions.subject} | URL: ${inviteUrl}`);
  }
};
