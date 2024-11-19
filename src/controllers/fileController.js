const asyncHandler = require("express-async-handler");

const {
  handleListFolderFiles,
  handleUpload,
  handleDownload,
  handleDelete,
} = require("../services/fileService");

/**
 * @desc Gets all the metadata of the files in the user's homepage drive account
 * @route GET /files or /files/home or /files/folders
 * @access Private
 */
const listFolderFiles = asyncHandler(async (req, res) => {
  const username = req.username;
  const email = req.email;
  let folderId = req.params.folderId;
  if (folderId === undefined) folderId = "root";
  // Get all files from the user's homepage
  const files = await handleListFolderFiles(username, email, folderId);
  if (files.message === "Unauthorized")
    return res.status(401).json({ message: "Unauthorized" });
  if (files.message === "No google credentials")
    return res.status(400).json({ message: "No google credentials" });
  return res.json(files);
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

/**
 * @desc Gets a file datastream by its ID
 * @route GET /files/:fileId or /files/folders/:folderId/:fileId
 * @access Private
 */
const downloadFile = asyncHandler(async (req, res) => {
  const username = req.username;
  const email = req.email;
  // Get the file from the google account
  const fileId = req.params.fileId;
  if (fileId !== req.body.id)
    return res.status(400).json({ message: "File id mismatch" });
  const owners_email = req.body.owners.map((owner) => owner.emailAddress);
  // Get the file datastream
  const data = await handleDownload(username, email, fileId, owners_email);
  if (data.message === "Unauthorized")
    return res.status(401).json({ message: "Unauthorized" });
  return res.status(200).json({ message: "File retrieved", data: data });
});

/**
 * @desc Deletes a file from the user's homepage drive account
 * @route DELETE /files/:fileId
 * @access Private
 */
const deleteFile = asyncHandler(async (req, res) => {
  const username = req.username;
  const email = req.email;
  // Get the file from the google account
  let fileId = req.params.fileId; 
  // If file id is empty take folder id
  if (req.params.fileId === undefined && req.params.folderId !== undefined) 
    fileId = req.params.folderId;

  if (fileId !== req.body.id)
    return res.status(400).json({ message: "File id mismatch" });
  const owners_email = req.body.owners.map((owner) => owner.emailAddress);
  // Delete the file from the google account
  const data = await handleDelete(username, email, fileId, owners_email);
  if (data.message === "Unauthorized")
    return res.status(401).json({ message: "Unauthorized" });
  if (data.message === "File not found")
    return res.status(404).json({ message: "File not found" });
  if (data.message === "Failed to delete file")
    return res.status(400).json({ message: "Failed to delete file" });
  if (data.message === "File deleted")
    return res.status(200).json({ message: "File deleted" });
  return res.status(500).json({ message: "Internal Server Error" });
});

module.exports = {
  listFolderFiles,
  uploadFile,
  downloadFile,
  deleteFile,
};
