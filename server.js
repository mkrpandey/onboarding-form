const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse JSON and form-data (important for file uploads)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Use timestamp as filename
  }
});

const upload = multer({ storage: storage });

// Route for file upload
app.post('/upload', upload.single('aadhaarFile'), (req, res) => {
  const uploadedFilePath = path.join(__dirname, 'uploads', req.file.filename);

  res.json({ success: true, filePath: uploadedFilePath });
});

// Route for final submission (send email with uploaded file)
app.post('/final-submit', (req, res) => {
  const { email, filePath } = req.body;

  if (!email || !filePath) {
    return res.status(400).json({ success: false, message: 'Email and file path are required.' });
  }

  // Nodemailer setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',  // Use an app-specific password if 2FA is enabled
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Aadhaar File Upload Confirmation',
    text: 'Your Aadhaar file has been successfully uploaded. Please find the attached file.',
    attachments: [
      {
        filename: path.basename(filePath),
        path: filePath,
      }
    ]
  };

  // Send email with the uploaded file as attachment
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error:', error);
      return res.status(500).json({ success: false, message: 'Error sending email.' });
    }

    console.log('Email sent:', info.response);
    res.status(200).json({ success: true, message: 'Email sent successfully.' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
