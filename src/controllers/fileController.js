const File = require("../models/File");
const asyncHandler = require("express-async-handler");

const listFiles = require("./drive");

// @desc Get all files
// @route GET /files
// @access Private
const getAllFiles = asyncHandler(async (req, res) => {
    // TODO: Get the token from the google account drives

    // TODO: Get the oauth2Client from the token 

    // TODO: Check if the token is valid
    
    // TODO: Get all files from all the tokens
    console.log("Get all files");

    const files = await listFiles();
});

// @desc Upload new file
// @route POST /files
// @access Private
const uploadFile = asyncHandler(async (req, res) => {
  
});

// @desc Delete a file
// @route DELETE /files
// @access Private
const deleteFile = asyncHandler(async (req, res) => {
  
});

module.exports = { getAllFiles, uploadFile, deleteFile };
