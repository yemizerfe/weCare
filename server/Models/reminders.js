const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    time: {
        type: String,
        required: true
    },
    reminder: {
        type: String,
        required: true
    },
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('reminderSchema', reminderSchema);