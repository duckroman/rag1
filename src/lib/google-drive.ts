import { google } from 'googleapis';

// Scopes required for the application
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Function to get the authenticated Google Drive API client
export const getGoogleDriveClient = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Missing Google Drive API credentials in .env.local');
  }

  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  // Set the refresh token
  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  // Create a new Drive API client
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  return drive;
};
