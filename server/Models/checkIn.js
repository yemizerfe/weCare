const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true,
    },
    // Local calendar day chosen by the patient's browser (YYYY-MM-DD).
    dateKey: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/,
        index: true,
    },
    // "reminder:<id>" or "routine:<id>:<stepIndex>"
    itemId: {
        type: String,
        required: true,
        maxlength: 120,
    },
}, { timestamps: true });

checkInSchema.index({ patientId: 1, dateKey: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
