const File = require("../models/File");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const { google } = require("googleapis");
const { OAuth2Clients } = require("../middleware/OAuth2ClientManager");
const { listHomeFiles, listFilesFolder, getFilebyId } = require("./drive");

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
const uploadFile = asyncHandler(async (req, res) => {
  // Get the file from the request

  // Get one of the clients
  const client =
    OAuth2Clients[Math.floor(Math.random() * OAuth2Clients.length)];
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(client["tokens"]);
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // Upload the file
  const requestBody = {
    name: "cat_blue.png",
    fields: "id",
  };
  const media = {
    mimeType: "image/png",
    body: fs.createReadStream("files/cat_blue.png"),
  };
  try {
    const file = await drive.files.create({
      requestBody,
      media: media,
    });
    console.log("File Id:", file.data.id);
    res.json({ message: "File uploaded", file: file.data });
  } catch (error) {
    console.error(error);
  }
});

// @desc Delete a file
// @route DELETE /files
// @access Private
const deleteFile = asyncHandler(async (req, res) => {});

// @desc Get all files from a folder
// @route GET /files/folders/:folderId
// @access Private
const getFolderFiles = asyncHandler(async (req, res) => {
  const folderId = req.params.folderId;
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({ username }).exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  

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
        fields: "nextPageToken, files(id, name, owners)",
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

// @desc Get file by id
// @route GET /files/:fileId
// @access Private
const getFile = asyncHandler(async (req, res) => {});

module.exports = {
  getAllFiles,
  uploadFile,
  deleteFile,
  getFolderFiles,
  getFile,
};
