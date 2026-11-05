const mongoose = require('mongoose');

const careNoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    note: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    category: {
        type: String,
        enum: ['handoff', 'preference', 'conversation'],
        required: true,
    },
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
}, { timestamps: true });

careNoteSchema.index({ caregiverId: 1, createdAt: -1 });

module.exports = mongoose.model('CareNote', careNoteSchema);
