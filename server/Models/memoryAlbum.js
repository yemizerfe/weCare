const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    imageName: String,
    description: {
        type: String,
        required: true,
        maxlength: 240
    },
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Album', albumSchema);