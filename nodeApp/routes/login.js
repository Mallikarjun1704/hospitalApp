const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const tokenStore = require('../utils/tokenStore');

// Use tokenStore instead of local set

// Generate access and refresh tokens
const generateAccessToken = (user) => {
  // user may be a mongoose doc or a decoded token payload
  const id = user._id || user.id;
  const username = user.email || user.username || user.emailId;
  return jwt.sign({ _id: id, username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
};

const generateRefreshToken = (user) => {
  const id = user._id || user.id;
  const username = user.email || user.username || user.emailId;
  return jwt.sign({ _id: id, username }, process.env.REFRESH_TOKEN_SECRET);
};

// Login route to generate tokens
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  // Compare provided password with hashed password in database
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  // Store refresh token so it can be revoked. In production, persist in DB
  tokenStore.addRefreshToken(refreshToken);
  const userId = user._id;
  let userName = user.userName;
  let age = user.age;
  let userType = user.userType;
  let emailId = user.email;

  res.json({ accessToken, refreshToken, userId, userName, age, userType, emailId });
});

/*router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  // Compare provided password with hashed password in database
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });

  const userId = user._id;
  let userName = user.userName;
  let age = user.age;
  let userType = user.userType;
  let emailId = user.email;

  res.json({ userId, userName, age, userType, emailId });
});*/

// Refresh token route: verifies token is present in store and rotates refresh tokens
router.post('/token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.sendStatus(401);

  // Ensure provided token is one we issued
  if (!tokenStore.hasRefreshToken(token)) return res.sendStatus(403);

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);

    // rotation: remove old token and issue a new refresh token
    tokenStore.deleteRefreshToken(token);
    const newAccessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);
    tokenStore.addRefreshToken(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  });
});

// Logout / revoke refresh token
router.post('/logout', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });
  // remove refresh token from store and optionally revoke access token
  // remove refresh token from store
  tokenStore.deleteRefreshToken(token);
  // if access token provided in body, revoke that as well
  if (req.body.accessToken) {
    tokenStore.addRevokedAccessToken(req.body.accessToken);
  }
  res.json({ message: 'Logged out / refresh token revoked' });
});

module.exports = router;