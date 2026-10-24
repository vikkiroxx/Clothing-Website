import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Falls back to logging the email to the console when SMTP_HOST isn't
// configured, so signup/OTP flows are testable locally before real SMTP
// credentials exist — mirrors how CASHFREE_*/CLOUDINARY_* placeholders work
// elsewhere in this project.
export async function sendMail(to: string, subject: string, html: string) {
  const client = getTransporter();
  if (!client) {
    console.log(`\n[mailer] SMTP not configured — would send email:\nTo: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }

  await client.sendMail({
    from: process.env.SMTP_FROM ?? "The Off-Grid <no-reply@theoffgrid.com>",
    to,
    subject,
    html,
  });
}
