const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt =  require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware =  require('../middlewares/authMiddleware');
const Doctor = require('../models/doctorModel');

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

router.post('/get-user-by-id', authMiddleware,  async(req, res)=> {
    try {
       const user = await User.findOne({ _id: req.body.userId }); 
       user.password = undefined;
       console.log(user);
       if(!user){
        req.status(200).send({ message: 'User does not exist', success: false });
       }else{
        res.status(200).send({success: true, data: {
            ...user
        }})
       }
    } catch (error) {
        res.status(500).send({ message: 'User info not found', success: false, error})
    }
})

router.post('/apply-doctor-account', authMiddleware, async(req, res) => {
    try {
       const newDoctor = new Doctor({...req.body, status: 'pending'});
        await newDoctor.save();
        const adminUser = await User.findOne({ isAdmin: true });
        console.log('Showing new doctor ',newDoctor);
        const unseenNotifications = adminUser.unseenNotifications;
        unseenNotifications.push({
            type: 'new-doctor-request',
            message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for doctor account`,
            data: {
                doctorId: newDoctor._id,
                name: newDoctor.firstName + ' '  + newDoctor.lastName
            },
            onClickPath: '/admin/doctors'    
        })
        await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
        res.status(200).send({
            success: true,
            message: 'Doctor account applied successfully'
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({message: "Error applying for doctor account", success: false});
    }
});

router.post('/mark-all-notifications-as-seen', authMiddleware, async(req, res) => {
    try {
       const user = await User.findOne({_id: req.body.userId});
       const unseenNotifications = user._doc.unseenNotifications;
       const seenNotifications = user._doc.seenNotifications;
       seenNotifications.push(...unseenNotifications);
       user.unseenNotifications = [];
       user.seenNotifications = seenNotifications; 
       const updatedUser = await user.save();
       updatedUser.password = undefined;
       
       res.status(200).send({
        success: true,
        message: 'All notifications marked as seen'
       });
    } catch (error) {
        console.log(error)
        res.status(500).send({message: "Error clearing notifications", success: false});
    }
});

router.post('/delete-all-notifications', authMiddleware, async(req, res) => {
    try {
       const user = await User.findOne({_id: req.body.userId});
       const unseenNotifications = user._doc.unseenNotifications;
       user.seenNotifications = [];
       user.unseenNotifications = [];

       const updatedUser = await user.save()
       updatedUser.password = undefined;
       
       res.status(200).send({
        success: true,
        message: 'All notifications marked are deleted'
       });
    } catch (error) {
        console.log(error)
        res.status(500).send({message: "Error clearing notifications", success: false});
    }
});

module.exports = router;