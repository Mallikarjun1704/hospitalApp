const express = require('express');
const router = express.Router();
const User = require('../models/User');

//get User
router.get('/getUserAllUsers', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//get User by Id
router.get('/getUser/:id', async (req, res) => {

  try {
    //uncomment the below lines to enable authentication check
    /*if (req.user._id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }*/
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registration: Create user accounts
// - If NO admin exists yet: anyone can register (creates the first admin)
// - If an admin exists: only authenticated admins can create new accounts
router.post('/register', async (req, res) => {
  try {
    const adminExists = await User.exists({ userType: 'admin' });

    if (adminExists) {
      // An admin already exists — only allow authenticated admins to create new accounts
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ 
          message: 'Initial setup already completed. Please log in as admin to create new accounts.' 
        });
      }

      // Verify the token and check admin role
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const requestingUser = await User.findById(decoded._id);
        
        if (!requestingUser || requestingUser.userType !== 'admin') {
          return res.status(403).json({ 
            message: 'Only administrators can create new user accounts.' 
          });
        }
      } catch (tokenErr) {
        return res.status(401).json({ 
          message: 'Invalid or expired authentication token.' 
        });
      }

      // Admin is authenticated — create the new user with the requested userType
      const { email } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Check for duplicate phone number
      if (req.body.phoneNumber) {
        const existingPhone = await User.findOne({ phoneNumber: req.body.phoneNumber });
        if (existingPhone) {
          return res.status(400).json({ message: 'User with this phone number already exists' });
        }
      }

      const newUser = new User({ ...req.body });
      await newUser.save();
      return res.status(201).json({ message: `${(req.body.userType || 'user').charAt(0).toUpperCase() + (req.body.userType || 'user').slice(1)} account created successfully` });
    }

    // No admin exists yet — first-time setup, force admin role
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ ...req.body, userType: 'admin' });
    await newUser.save();
    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

router.put('/updateUser/:id', async (req, res) => {
  try {
    // //uncomment the below lines to enable authentication check
    /*if (req.user._id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }*/

    // Find the user by ID and update their details
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return the updated user and validate the input
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user route
router.delete('/deleteUser/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;