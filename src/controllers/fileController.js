const asyncHandler = require("express-async-handler");
const fs = require("fs");

const { handleUpload } = require("../services/fileService");
const {
  listFilesFolder,
  getFilebyId,
} = require("../services/driveService");

const User = require("../models/User");

// @desc Get all files
// @route GET /files
// @access Private
const getAllFiles = asyncHandler(async (req, res) => {
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get all files from the google accounts
  const credentials = foundUser.google_credentials;
  if (!credentials) {
    return res.status(400).json({ message: "No google credentials" });
  }
  const files = new Array();
  for (const googleCred of credentials) {
    const folderFiles = await listFilesFolder(googleCred.tokens, "root");
    folderFiles.map((file) => files.push(file));
  }
  res.json({ message: "Files from home", files: files });
});


/**
 * @desc Upload a file to a folder
 * @route POST /files/folders/:folderId
 * @access Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  const folderId = req.params.folderId;
  const username = req.username;
  const email = req.email;
  const files = req.files;
  if (!files || files.length === 0)
    return res.status(400).json({ message: "No files uploaded" });
  try {
    const result = await handleUpload(username, email, files, folderId);
    if (result.message !== "Files uploaded")
      return res.status(400).json({ message: result.message });
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error uploading file:", err);
    return res.status(500).json({ message: "Internal Server Error" });
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
  console.log("Get folder files");
  const folderId = req.params.folderId;
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get the google credentials
  const credentials = foundUser.google_credentials;
  if (!credentials) {
    return res.status(400).json({ message: "No google credentials" });
  }
  // Get all files from the google accounts
  const files = new Array();
  for (const googleCred of credentials) {
    const folderFiles = await listFilesFolder(googleCred.tokens, folderId);
    folderFiles.map((file) => files.push(file));
  }
  res.json({ message: `Files from folder: ${folderId}`, files: files });
});

// @desc Get file by id
// @route GET /files/:fileId or /files/folders/:folderId/:fileId
// @access Private
const getFile = asyncHandler(async (req, res) => {
  console.log("Get file");
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get the file from the google account
  const fileId = req.body.id;
  if (fileId !== req.params.fileId) {
    return res.status(400).json({ message: "File id mismatch" });
  }
  const googleEmails = req.body.owners.map((owner) => owner.emailAddress);
  googleEmails.map(async (email) => {
    const googleCred = foundUser.google_credentials.find(
      (cred) => cred.email === email
    );
    if (googleCred) {
      const data = await getFilebyId(googleCred.tokens, fileId);
      // TODO: Only for testing, remove when done
      const dest = fs.createWriteStream(`${req.body.name}`);
      data
        .on("end", () => console.log("Done."))
        .on("error", (err) => {
          console.log(err);
          return process.exit();
        })
        .pipe(dest);
      //
      res.json({ message: "File retrieved", data });
    }
  });
});

module.exports = {
  getAllFiles,
  uploadFile,
  deleteFile,
  getFolderFiles,
  getFile,
};
