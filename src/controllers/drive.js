const { google } = require("googleapis");

/**
 * Lists the names and IDs of all files in the user's Google Drive.
 * @param { { access_token, refresh_token, scope,
 * token_type, id_token, expiracy_date} } tokens An OAuth2 client token.
*/
async function listFiles(tokens) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const res = await drive.files.list({
    fields: "nextPageToken, files(id, name)",
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log("No files found.");
    return;
  }
  // Print files
  // TODO: Return object with file metadata instead of printing
  console.log("Files:");
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
  return files;
}

module.exports = listFiles;
