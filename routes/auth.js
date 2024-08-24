const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { sendThankYouEmail, sendResetPasswordEmail } = require('../emailServices');

const router = express.Router();

router.get('/', (req, res) => { res.json("Hi")});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password, email, role } = req.body;

  try {
    let user = await User.findOne({ email });
    // console.log(user);
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const validRoles = ['admin', 'user', 'guest'];
    if (!validRoles.includes(role)){
      return res.status(400).json({ msg: 'Invalid role' });
    }

    // Create new user
    user = new User({
      username: username,
      password: password,
      email: email,
      role: role || 'user'
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save new user
    await user.save();

    // Send thank you email
    sendThankYouEmail(email, username);

    // Create and retun jwt
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({token});
      }
    )
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
})

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if username exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid password' });

    // Create and retun jwt
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({token});
      }
    )
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token
// @access  Public
router.post('/forgot-password', async(req, res) => {
  const { email } = req.body;
  try {
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour from now

    // Find and update the user document
    const user = await User.findOneAndUpdate(
        { email },
        {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires
        },
        { new: true } // Return the updated document
    );

    if (!user) {
        return res.status(400).json({ msg: 'No user found with that email address' });
    }

    sendResetPasswordEmail(email, resetToken);
    res.json({msg: 'Reset pasword email sent'});
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  // console.log(token);
  // console.log(newPassword);
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    console.log(user);

    if (!user) return res.status(400).json({ msg: 'Password reset token is invalid or has expired'});

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();
    res.json({ msg: 'Password has been updated' });
  }
  catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;