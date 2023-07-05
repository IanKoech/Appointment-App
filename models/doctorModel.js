const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
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
            required: true
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
            requried: true
        },
        consultationFees: {
            type: Number,
            required: true
        },
        consultationHours: {
            type: Object,
            required: true
        },
        timings: {
            type: Array,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const doctorModel = mongoose.Model('doctors', doctorSchema);