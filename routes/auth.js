const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Batch = require('../models/batch');
const bcrypt = require('bcrypt');

require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, registerNumber, email, password, confirmPassword, role, batch } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let batchIn;
        if (role === 'student') {
            batchIn = await Batch.findById(batch);
            if (!batchIn) {
                return res.status(400).json({ message: 'Invalid batch ID' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            registerNumber,
            email,
            password: hashedPassword,
            role,
            ...(role === 'student' && { batch: batchIn._id, batchName: batchIn.batchName })
        });

        await user.save();
        res.json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // console.log(email, password);

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token with 1-hour expiry
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Payload includes user ID and role
            process.env.JWT_SECRET,
            { expiresIn: '1h', algorithm: 'HS512' } // Token expires in 1 hour
        );

        // Send the token as a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'Strict', // Prevent CSRF attacks
            maxAge: 3600000, // 1 hour in milliseconds
        });

        // Send the token and user info in the response body
        res.json({
            message: 'Login successful',
            token, // Include token in the response if needed for client-side storage
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

router.get('/users', async (req, res) => {
   try{
    const users = await User.find();
    const filteredUsers = users.map(user => {
        return {
            id: user._id,
            name: user.name,
            department: user.department,
            rollNo: user.registerNumber,
            email: user.email,
            role: user.role
        };
    });
    res.status(200).json(filteredUsers);

    } catch(err){
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }}); 

router.put('/updateusers', async (req, res) => {
    try {
        const { _id, name, registerNumber, email, role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            console.log('Invalid ID:', _id); // Debugging log
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.registerNumber = registerNumber || user.registerNumber;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error occurred:', err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});



router.delete('/deleteusers', async (req, res) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'Invalid input: ids must be a non-empty array' });
            }
            for (const id of ids) {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({ message: `Invalid user ID: ${id}` });
                }
            }
            const deleteResults = await User.deleteMany({ _id: { $in: ids } });
    
            if (deleteResults.deletedCount === 0) {
                return res.status(404).json({ message: 'No users found to delete' });
            }
    
            res.status(200).json({ message: 'Users deleted successfully', deletedCount: deleteResults.deletedCount });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Something went wrong' });
        }
});

router.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: `Invalid user ID: ${userId}` });
        }

        const user = await User.findById(userId).select('name registerNumber batchName batch');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong'});
    }
});



router.get('/individualDetail/:id' ,async(req , res) =>{
    try{
        const userId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: `Invalid user ID: ${userId}` });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Something went wrong'});
    }
})

router.put('/changePassword', async (req, res) => {
    const { studentId, newPassword } = req.body;
    // console.log(newPassword);

    if (!studentId || !newPassword) {
        return res.status(400).json({ message: 'Student ID and new password are required.' });
    }

    try {
        const user = await User.findById(studentId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'An error occurred while changing the password. Please try again later.' });
    }
});

module.exports = router;
