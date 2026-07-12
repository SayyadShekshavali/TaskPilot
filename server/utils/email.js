import nodemailer from 'nodemailer';

let transporter;

try {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '2525', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } else {
    console.warn('SMTP credentials not fully configured. Using mock console mailer.');
  }
} catch (error) {
  console.error('Failed to configure SMTP transporter:', error);
}

export const sendInviteEmail = async (email, taskTitle, inviteUrl) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"TaskPilot" <noreply@taskpilot.io>',
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
