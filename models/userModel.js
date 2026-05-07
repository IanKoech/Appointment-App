// const mongoose = require('mongoose');
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        isDoctor: {
            type: Boolean,
            default: false
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        lastLoginAt: {
            type: Date
        },
        loginCount: {
            type: Number,
            default: 0
        },
        isVerified: {
            type: Boolean,
            default: false,
            index: true
        },
        emailOtpHash: {
            type: String
        },
        emailOtpExpiresAt: {
            type: Date
        },
        seenNotifications: {
            type: Array,
            default: []
        },
        unseenNotifications: {
            type: Array,
            default: []
        }
    },
    {
        timestamps: true
    }
);

const userModel = mongoose.model('users', userSchema);

// module.exports = userModel;
export default userModel;
