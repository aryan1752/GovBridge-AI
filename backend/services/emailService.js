import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // your gmail
    pass: process.env.EMAIL_PASS    // app password
  }
});

export const sendContactEmail = async ({ name, email, subject, message }) => {
  const mailOptions = {
    from: `"NyayBharat Website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_RECEIVER,   // where you want messages delivered
    subject: `New Contact Message: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br>${message}</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
