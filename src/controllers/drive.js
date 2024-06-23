const fs = require("fs");
const { google } = require("googleapis");

/**
 * Lists the names and IDs of all files in the user's homepage Google Drive.
 * @param {{ access_token, refresh_token, scope,
 * token_type, id_token, expiracy_date}} tokens Client tokens.
 * @returns { Array<{ kind, fileExtension, mimeType, parents, owners,
 * size, id, name}> || undefined } An array of file metadata objects.
 */
async function listHomeFiles(tokens) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  // Create a drive client
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // List files
  try {
    const res = await drive.files.list({
      fields:
        "nextPageToken, files(id, name, parents, kind, mimeType, fileExtension, size, properties, owners)",
      q: "'root' in parents",
    });
    const files = res.data.files;
    console.log(files);
    if (files.length === 0) {
      console.log("No files found.");
      return;
    }
    return files;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Lists the names and IDs of all files in the folderId.
 * @param {{ access_token, refresh_token, scope,
 * token_type, id_token, expiracy_date}} tokens Client tokens.
 * @param {string} folderId The ID of the folder to list files from.
 * @returns { Array<{ kind, fileExtension, mimeType, parents, owners,
 * size, id, name}> || undefined } An array of file metadata objects.
 */
async function listFilesFolder(tokens, folderId) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  // Create a drive client
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // List files
  try {
    const res = await drive.files.list({
      fields:
        "nextPageToken, files(id, name, parents, kind, mimeType, fileExtension, size, properties, owners)",
      q: `'${folderId}' in parents`,
    });
    const files = res.data.files;
    console.log(files);
    if (files.length === 0) {
      console.log("No files found.");
      return;
    }
    return files;
  } catch (error) {
    // TODO: Change to logger
    console.error(error);
  }
}

async function getFilebyId(tokens, fileId) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  // Create a drive client
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // Get file
  try {
    const res = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );
    console.log(res.data.name);
    const dest = fs.createWriteStream(`${res.data.name}`);
    const data = res.data;
    data
      .on("end", () => console.log("Done."))
      .on("error", (err) => {
        console.log(err);
        return process.exit();
      })
      .pipe(dest);
    return data;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { listHomeFiles, listFilesFolder, getFilebyId };
