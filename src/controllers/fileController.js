const File = require("../models/File");
const asyncHandler = require("express-async-handler");

const { OAuth2Clients } = require("../middleware/OAuth2ClientManager");
const listFiles = require("./drive");

// @desc Get all files
// @route GET /files
// @access Private
const getAllFiles = asyncHandler(async (req, res) => {
  // TODO: Check if the token is valid
  // TODO: Get all files from all the tokens
  OAuth2Clients.map((tokens) => {
    listFiles(tokens);
  });
  res.json({ message: "Get all files" });
});

// @desc Upload new file
// @route POST /files
// @access Private
const uploadFile = asyncHandler(async (req, res) => {});

// @desc Delete a file
// @route DELETE /files
// @access Private
const deleteFile = asyncHandler(async (req, res) => {});

module.exports = { getAllFiles, uploadFile, deleteFile };
