const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt =  require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async(req, res) => {
    try {
        const userExists = await User.findOne({email: req.body.email})
       
        if(userExists){
            return res.status(400).send({message: 'User already exists', success: false});
        } 
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        req.body.password = hashedPassword;

        const newUser = new User(req.body);

        await newUser.save(); //saves document in mongodb
        res.status(200).send({message:'User created succefully', success: true})
   
    } catch (error) {
        res.status(500).send({message: "Error creating user", success: false});
    }
});

router.post('/login', async(req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});
        console.log('User object', user);
        if(!user){
            return res.status(200).send({message: "User does not exist", success: false});
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);//compares encrypted password
        if(!isMatch){
            res.status(200).send({message: 'Password is incorrect', success: false});    
        }else{
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });
            res.status(200).send({message:'Login Successful', success: true,data: token});
        }
    } catch (error) {
        console.log("Displaying login errors :",error);
        res.status(500).send({message: 'Error logging in', success: false});
    }
});

module.exports = router;