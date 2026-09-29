const nodemailer = require('nodemailer');

let transporter; // undefined = not created yet, null = SMTP not configured

function getTransporter() {
    if (transporter !== undefined) return transporter;
    if (!process.env.SMTP_HOST) {
        transporter = null;
        return transporter;
    }
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 = implicit TLS, 587/25 = STARTTLS
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    return transporter;
}

// Sends an email. When SMTP is not configured (local development) the email is
// printed to the server console instead, so the reset flow can still be tried.
async function sendMail({ to, subject, text, html }) {
    const t = getTransporter();
    if (!t) {
        console.log('\n[mail] SMTP is not configured, so this email was NOT sent. Printing it here instead:');
        console.log(`To: ${to}\nSubject: ${subject}\n\n${text}\n`);
        return { sent: false };
    }
    await t.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });
    return { sent: true };
}

module.exports = { sendMail };
