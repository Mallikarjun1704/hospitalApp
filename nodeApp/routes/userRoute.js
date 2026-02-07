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

// Create User route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create a new user
  const newUser = new User(req.body);

  try {
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
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

module.exports = router;