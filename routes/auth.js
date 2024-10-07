const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
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

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, 'bcc-bitCarrierConnect', { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.log(err);
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
