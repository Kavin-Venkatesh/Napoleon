const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/register', async (req, res)=>{
    try{
        const {email, password,role} = req.body;
        const user = new User({email, password,role});
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({message: 'User created successfully'});
    }
    catch(err){
        console.log(err);
        res.status(500).json({message: 'Something went wrong'});
    }
}
);

router.post('/login', async (req, res)=>{
    try{
     const {email, password} = req.body;
     const user = await User.findOne({email});
     if(!user){
         return res.status(404).json({message: 'User not found'});
     }
     const  isMatch = await bcrypt.compare(password, user.password);
     if(user &&!isMatch){
         return res.status(401).json({message: 'Incorrect password'});
     }
     const token = jwt.sign({ userId : user._id } ,process.env.JWT_SECRET, {expiresIn: '1h'});
     
     res.send({ message: 'Logged in successfully', token, userRole: user.role });
    }
    catch(err){
         console.log(err);
    }
 })

module.exports = router;
