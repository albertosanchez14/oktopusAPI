const File = require("../models/File");
const asyncHandler = require("express-async-handler");

const { google } = require("googleapis");
const { OAuth2Clients } = require("../middleware/OAuth2ClientManager");
const { listHomeFiles, listFilesFolder } = require("./drive");
const { response } = require("express");

// @desc Get all files
// @route GET /files
// @access Private
const getAllFiles = asyncHandler(async (req, res) => {
  // TODO: Check if the token is valid
  const files = new Array();
  for (client of OAuth2Clients) {
    const homeFiles = await listHomeFiles(client["tokens"]);
    homeFiles.map((file) => files.push(file));
  }
  res.json({ message: "Files from home", files: files });
});

// @desc Upload new file
// @route POST /files
// @access Private
const uploadFile = asyncHandler(async (req, res) => {});
const uploadFile = asyncHandler(async (req, res) => {});

// @desc Delete a file
// @route DELETE /files
// @access Private
const deleteFile = asyncHandler(async (req, res) => {});

// @desc Get all files from a folder
// @route GET /files/folders/:folderId
// @access Private
const getFolderFiles = asyncHandler(async (req, res) => {
  const folderId = req.params.folderId;
  const files = new Array();
  for (const client of OAuth2Clients) {
    // Get the files from the google account
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(client["tokens"]);
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    try {
      const res = await drive.files.list({
        fields:
          "nextPageToken, files(id, name, owners)",
        q: `'${folderId}' in parents`,
      });
      // 
      const folderFiles = await listFilesFolder(client["tokens"], folderId);
      folderFiles.map((file) => files.push(file));
      //
    } catch (error) {
      console.log(error);
    }
  }
  res.json({ message: `Files from folder: ${folderId}`, files: files });
});

module.exports = { getAllFiles, uploadFile, deleteFile, getFolderFiles };
