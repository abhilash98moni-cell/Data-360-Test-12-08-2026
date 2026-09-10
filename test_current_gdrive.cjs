const { google } = require('googleapis');
require('dotenv').config();

async function run() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  console.log("clientId present:", !!clientId);
  console.log("clientSecret present:", !!clientSecret);
  console.log("refreshToken present:", !!refreshToken);
  console.log("rootFolderId present:", !!rootFolderId);

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    console.log("Testing drive.files.create...");
    const res = await drive.files.create({
      requestBody: { name: 'test_upload.txt', parents: rootFolderId ? [rootFolderId] : undefined },
      media: { mimeType: 'text/plain', body: 'Hello' },
      fields: 'id'
    });
    console.log("Success:", res.data.id);
  } catch (err) {
    console.log("HTTP Status:", err.code || (err.response && err.response.status));
    if (err.response && err.response.data && err.response.data.error) {
      console.log("Google Error:", JSON.stringify(err.response.data.error));
    } else {
      console.log("Error Message:", err.message);
    }
  }
}
run();
