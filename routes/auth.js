const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        console.log(req.body);
        const { name, registerNumber, email, password, confirmPassword, role } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            registerNumber,
            email,
            password: hashedPassword,
            role
        });
        await user.save();
        res.json({ message: 'User created successfully' },);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many login attempts from this IP, please try again later'
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

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

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },  // Payload includes user ID and role
            process.env.JWT_SECRET,
            { expiresIn: '1h', algorithm: 'HS512' }  // Secure algorithm and 1 hour expiry
        );

        // Send the token as a cookie for extra security
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use secure in production
            sameSite: 'Strict', // Prevent CSRF attacks
            maxAge: 3600000, // 1 hour
        });

        // Send the token and user info in the response body
        res.json({
            token, // Send token to be stored in localStorage
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
            const { id, name, rollNo, email, role } = req.body;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
    
            const user = await User.findById(id);
    
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            user.name = name || user.name;
            user.registerNumber = rollNo || user.rollNo;
            user.email = email || user.email;
            user.role = role || user.role;
            await user.save();
            res.status(200).json({ message: 'User updated successfully' });
        } catch (err) {
            console.log(err);
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
    

module.exports = router;
