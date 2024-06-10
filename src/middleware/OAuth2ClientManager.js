const fs = require("fs");
const { google } = require("googleapis");

const OAuth2Clients = [];

/**
 * Adds the tokens to the OAuth2Clients list if it isn't already present.
 * @param { { access_token, refresh_token, scope,
 * token_type, id_token, expiracy_date} } tokens An OAuth2 client token.
 */
async function addAcount(tokens) {
  const oauth2Client_new = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client_new.setCredentials(tokens);
  let oauth2_new = google.oauth2({
    auth: oauth2Client_new,
    version: "v2",
  });
  const { data } = await oauth2_new.userinfo.get(); // get user info
  const email_new = data.email;

  // If the account is already added, return
  for (const token of OAuth2Clients) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(token);
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    const { data } = await oauth2.userinfo.get(); // get user info
    const email = data.email;
    if (email === email_new) {
      console.log("Account already added");
      return;
    }
  }
  OAuth2Clients.push(tokens);
  // Save the tokens to a file
  fs.writeFileSync(`credentials/tokens_${data.email}.json`, JSON.stringify(tokens));
}

module.exports = { addAcount, OAuth2Clients };
