const mongoose = require('mongoose');
const crypto = require('crypto');

const userInfoSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true

    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['patient', 'caregiver'],
        required: true
    },
    caregiverCode: {
        type: String,
        unique: true,
        sparse: true,
        default: function () {
            return this.role === 'caregiver' ? crypto.randomBytes(5).toString('hex').toUpperCase() : undefined;
        }
    },
    linkedCaregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    // Care profile fields, editable by the patient and readable by a linked caregiver.
    preferredName: { type: String, trim: true, maxlength: 60, default: '' },
    aboutMe: { type: String, trim: true, maxlength: 600, default: '' },
    allergies: { type: String, trim: true, maxlength: 300, default: '' },
    medications: { type: String, trim: true, maxlength: 500, default: '' },
    emergencyContactName: { type: String, trim: true, maxlength: 100, default: '' },
    emergencyContactPhone: { type: String, trim: true, maxlength: 40, default: '' },
    doctorName: { type: String, trim: true, maxlength: 100, default: '' },
    doctorPhone: { type: String, trim: true, maxlength: 40, default: '' },
    homeAddress: { type: String, trim: true, maxlength: 200, default: '' },
    locationSharing: {
        type: Boolean,
        default: false
    },
    lastLocation: {
        latitude: Number,
        longitude: Number,
        updatedAt: Date
    }
},{ timestamps: true });

module.exports = mongoose.model('users',userInfoSchema);