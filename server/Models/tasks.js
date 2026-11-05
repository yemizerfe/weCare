const mongoose = require('mongoose');

const tasksSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        maxlength: 100
    },
    tasks:{
        type: String,
        required: true,
        maxlength: 2000
    },
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    }
},{timestamps: true});

module.exports = mongoose.model('tasksSchema',tasksSchema);