const fs = require("fs");

const User = require("../models/User");
const { uploadFiletoDrive } = require("./driveService");

async function handleUpload(username, email, files, folderId) {
  // Validate user in MongoDB
  const foundUser = await User.findOne({ username, email }).lean().exec();
  if (!foundUser) return { message: "Unauthorized" };
  // Get google credentials
  const credentials = foundUser.google_credentials;
  if (!credentials) return { message: "No google credentials" };
  // Upload files to Google Drive
  const googleFiles = [];
  for (const file of files) {
    let success = false;
    for (const googleCred of credentials) {
      try {
        const data = await uploadFiletoDrive(googleCred.tokens, file, folderId);
        if (data) {
          googleFiles.push(data);
          await fs.promises.unlink(file.path); // Delete local file after upload
          success = true;
          break;
        }
      } catch (err) {
        console.error("Error uploading to Google Drive:", err);
        continue; // Try next account if upload fails
      }
    }
    if (!success)
      return { message: `Failed to upload file: ${file.originalname}` };
  }
  return { message: "Files uploaded", files: googleFiles };
}

module.exports = { handleUpload };
