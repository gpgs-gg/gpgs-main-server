// const nodemailer = require('nodemailer');

// // Helper function to generate OTP
// const generateOTP = (length = 6) => {
//   const digits = '0123456789';
//   let otp = '';
//   for (let i = 0; i < length; i++) {
//     otp += digits[Math.floor(Math.random() * 10)];
//   }
//   return otp;
// };

// // Configure nodemailer transporter (example using Gmail)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'gopalspayingguestservices@gmail.com',      // replace with your email
//     pass: 'rmzq esdy abus ykdj',       // replace with your email password or app password
//   },
// });

// exports.sendOtp = async (req, res) => {
//     console.log("Request Body:", req.body); // Debugging line
//   const { email } = req.body;
//   if (!email) {
//     return res.status(400).json({ message: 'Email is required' });
//   }

//   const otp = generateOTP();

//   const mailOptions = {
//     from: 'gopalspayingguestservices@gmail.com', // replace with your email
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP code is: ${otp}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     // For demo purpose, send OTP back; remove in production
//     res.status(200).json({ message: 'OTP sent successfully', otp });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ message: 'Failed to send OTP' });
//   }
// };



// const nodemailer = require('nodemailer');

// // Helper function to generate OTP
// const generateOTP = (length = 6) => {
//   const digits = '0123456789';
//   let otp = '';
//   for (let i = 0; i < length; i++) {
//     otp += digits[Math.floor(Math.random() * 10)];
//   }
//   return otp;
// };

// // Configure nodemailer transporter (using Gmail)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'gopalspayingguestservices@gmail.com',      // replace with your email
//     pass: 'rmzq esdy abus ykdj',                       // use your App Password
//   },
// });

// // In-memory OTP store (for demo purposes)
// const otpStore = {}; // Format: { email: { otp: '123456', expiresAt: Date } }
  
// // Send OTP
// exports.sendOtp = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ message: 'Email is required' });
//   }

//   const otp = generateOTP();
//   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//   otpStore[email] = { otp, expiresAt };

//   console.log(`Generated OTP for ${email}: ${otp}, expires at ${expiresAt}`);

//   const mailOptions = {
//     from: 'gopalspayingguestservices@gmail.com',
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: 'OTP sent successfully' , otp: otp});
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ message: 'Failed to send OTP' });
//   }
// };

// exports.verifyOtp = (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return res.status(400).json({ message: 'Email and OTP are required' });
//   }

//   const record = otpStore[email];
//           console.log(22222222222, record);
//   if (!record) {
//     console.log(`No OTP found for email: ${email}`);
//     return res.status(400).json({ message: 'No OTP found for this email' });
//   }

//   const { otp: storedOtp, expiresAt } = record;

//   if (new Date() > expiresAt) {
//     console.log(`OTP expired for ${email}`);
//     delete otpStore[email];
//     return res.status(400).json({ message: 'OTP has expired' });
//   }

//   if (String(otp).trim() !== String(storedOtp).trim()) {
//     console.log(`Invalid OTP attempt for ${email}: input=${otp} stored=${storedOtp}`);
//     return res.status(400).json({ message: 'Invalid OTP' });
//   }

//   // Successful verification
//   console.log(`OTP verified for ${email}`);
//   delete otpStore[email]; // Remove OTP after verification
//   return res.status(200).json({ message: 'OTP verified successfully' });
// };

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const generateOTP = (length = 6) => {
  // Secure numeric OTP generation
  return crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'gopalspayingguestservices@gmail.com',
    pass: 'rmzq esdy abus ykdj',  // use app password or OAuth2 in prod
  },
});

// In-memory OTP store with additional info: { otp, expiresAt, attempts, lastSent }
const otpStore = {};

// Cleanup expired OTPs periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const email in otpStore) {
    if (otpStore[email].expiresAt < now) {
      delete otpStore[email];
      console.log(`Expired OTP cleared for ${email}`);
    }
  }
}, 5 * 60 * 1000);

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const now = Date.now();

  // Rate limiting: allow OTP resend only after 2 minutes
  if (otpStore[email] && otpStore[email].lastSent && now - otpStore[email].lastSent < 2 * 60 * 1000) {
    return res.status(429).json({ message: 'OTP already sent recently. Please wait before requesting again.' });
  }

  const otp = generateOTP(6);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  otpStore[email] = {
    otp,
    expiresAt,
    attempts: 0,
    lastSent: now,
  };

  const mailOptions = {
    from: 'gopalspayingguestservices@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const record = otpStore[email];
  if (!record) {
    return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  if (record.attempts >= 3) {
    delete otpStore[email];
    return res.status(429).json({ message: 'Too many invalid attempts. Please request a new OTP.' });
  }

  if (otp.trim() !== record.otp) {
    otpStore[email].attempts += 1;
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
  }

  // OTP is correct
  delete otpStore[email];
  return res.status(200).json({ message: 'OTP verified successfully.' });
};
