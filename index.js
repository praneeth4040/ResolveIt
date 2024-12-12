const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const UserInfo = require("./schemas/userInfoSchema");
const IssueInfo = require("./schemas/issueInfoSchema");
const nodemailer = require("nodemailer");
const yellow = 0;

const govBodies = [
    { name: "Roads and Infrastructure", email: "dhaneshvaibhav@gmail.com" },
    { name: "Water Supply", email: "Chakkasritejaswi@gmail.com" },
    { name: "Electricity", email: "bhavaniprasadjamalpur@gmail.com" },
    { name: "Sanitation and Hygene", email: "lyfspot26@gmail.com" }
  ];
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MongoDB_URL).then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "9h" }
  );
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); 
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Images only! (jpeg, jpg, png)"));
    }
  },
});


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.Email_Id, 
      pass: process.env.Email_password,
    },
  });

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized, no token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phoneno } = req.body;

    if (!name || !email || !password || !phoneno) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await UserInfo.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = new UserInfo({ name, email, password, phoneno });
    const savedUser = await newUser.save();
    res.status(201).json({ message: 'User registered successfully', user: savedUser });
  } catch (error) {
    console.error('Error in /signup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserInfo.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.status(200).json({ message: 'Signin successful', token });
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post(
  "/raise-issue",
  verifyToken,
  upload.array("images", 3),
  async (req, res) => {
    try {
      const { title, description, location, governmentBody } = req.body;

      if (!title || !description || !location || !governmentBody) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const imagePaths = req.files.map((file) => file.path);
      const newIssue = new IssueInfo({
        title,
        description,
        location,
        governmentBody,
        images: imagePaths, 
        userId: req.user.userId,
      });

      const savedIssue = await newIssue.save();


      const govBody = govBodies.find(
        (body) => body.name.toLowerCase() === governmentBody.toLowerCase()
      );

      if (!govBody) {
        return res.status(404).json({
          message: `Government body '${governmentBody}' not found.`,
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: govBody.email,
        subject: title,
        text: `Issue Description: ${description}\nLocation: ${location}`,
        attachments: imagePaths.map((imagePath) => ({
            filename: path.basename(imagePath),  
            path: imagePath,}))
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent:", info.response);
        }
      });
      res.status(201).json({ message: "Issue raised successfully", issue: savedIssue });

    } catch (error) {
      console.error("Error in /raise-issue:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`The app is listening on port ${PORT}`);
});
