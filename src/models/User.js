const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
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
    expiracy_date: {
        type: Date,
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
    googleTokens: {
        type: [tokenSchema],
        default: [],
        required: false
    }
});

module.exports = mongoose.model('User', userSchema);
