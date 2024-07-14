require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust the path based on your project structure
const userRouter = require('./routes/userRouter'); // Adjust the path based on your project structure

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Middleware for authentication
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Fetch weather data and send emails
const fetchWeatherAndSendEmail = async () => {
  try {
    const users = await User.find();
    for (const user of users) {
      const { data } = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${user.location}&appid=${process.env.OPENWEATHERMAP_API_KEY}`);
      const weatherData = `Weather in ${user.location}: ${data.weather[0].description}, Temperature: ${data.main.temp}`;
      const weatherReport = { date: new Date(), weatherData };

      user.weatherReports.push(weatherReport);
      await user.save();

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Hourly Weather Report',
        text: weatherData,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error.message);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching weather and sending email:', error.message);
  }
};

// Cron job to run every 3 hours
cron.schedule('0 */3 * * *', fetchWeatherAndSendEmail);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});


// Routes
app.use('/users', userRouter); // Mount userRouter at /users

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
