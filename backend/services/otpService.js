import nodemailer from 'nodemailer';

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail
      pass: process.env.EMAIL_PASSWORD, // App Password (not regular password)
    },
  });
};

// Send OTP via Email
export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    const transporter = createTransporter();
    
    let subject, html;
    
    if (purpose === 'verification') {
      subject = 'Verify Your NyayBharat Account';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to NyayBharat!</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `;
    } else if (purpose === 'reset') {
      subject = 'Reset Your NyayBharat Password';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>You requested to reset your password. Use this code:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please secure your account immediately.</p>
        </div>
      `;
    } else {
      subject = 'Your NyayBharat OTP';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your OTP Code</h2>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"NyayBharat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send OTP via SMS (Twilio) - Optional
export const sendOTPSMS = async (phone, otp) => {
  try {
    
    
    // For now, just log it (you can implement SMS later)
    console.log(`📱 OTP for ${phone}: ${otp} (SMS not configured)`);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    throw new Error('Failed to send OTP SMS');
  }
};

// Verify OTP - THIS IS THE IMPORTANT FUNCTION
export const verifyOTP = (storedOTP, storedExpiry, providedOTP) => {
  console.log('🔍 Verifying OTP...'); // DEBUG
  console.log('  Stored OTP:', storedOTP); // DEBUG
  console.log('  Provided OTP:', providedOTP); // DEBUG
  console.log('  Expiry:', storedExpiry); // DEBUG
  console.log('  Current time:', new Date()); // DEBUG

  if (!storedOTP || !storedExpiry) {
    console.log('❌ No OTP found in database'); // DEBUG
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  if (new Date() > new Date(storedExpiry)) {
    console.log('❌ OTP expired'); // DEBUG
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (storedOTP !== providedOTP) {
    console.log('❌ OTP mismatch'); // DEBUG
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  console.log('✅ OTP verified successfully'); // DEBUG
  return { valid: true, message: 'OTP verified successfully' };
};