const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },    
    access_token: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String,
        required: true,
    },
    scope: {
        type: String,
        required: true,
    },
    token_type: {
        type: String,
        required: true,
    },
    id_token: {
        type: String,
        required: true,
    },
    expiry_date: {
        type: Number,
        required: true,
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    google_tokens: {
        type: [tokenSchema],
        default: [],
        required: false
    }
});

module.exports = mongoose.model('User', userSchema);
