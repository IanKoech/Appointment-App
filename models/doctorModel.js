// const mongoose = require('mongoose');
import mongoose from "mongoose";
const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        website: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            required: true
        },
        specialization: {
            type: String,
            required: true
        },
        experience: {
            type: String,
            required: true
        },
        consultationFees: {
            type: Number,
            required: true
        },
        tillNumber: {
            type: Number,
            default: 174379,
       },
        timings: {
            type: Array,
            required: true
        },
        practitionerCadre: {
            type: String,
            enum: ['doctor', 'nurse', 'clinical-officer', 'dentist', 'other'],
            required: true,
            index: true
        },
        regulator: {
            type: String,
            enum: ['KMPDC', 'NCK', 'COC', 'HWR', 'OTHER'],
            required: true,
            index: true
        },
        registrationNumber: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        verificationNotes: {
            type: String,
            default: ''
        },
        verifiedAt: {
            type: Date
        },
        verifiedBy: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'expired'],
            default: 'pending',
            index: true
        }
    },
    {
        timestamps: true
    }
);

const doctorModel = mongoose.model('doctors', doctorSchema);

// module.exports = doctorModel;

export default doctorModel;
