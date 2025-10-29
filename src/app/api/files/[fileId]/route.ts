import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Scopes required for the application
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Function to get the authenticated Google Drive API client
const getGoogleDriveClient = () => {
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

const GOOGLE_DOCS_MIME_TYPES = {
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  SHORTCUT: 'application/vnd.google-apps.shortcut',
};

// GET handler for fetching file content for preview
export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const drive = getGoogleDriveClient();
    let effectiveFileId = fileId;

    const metadataResponse = await drive.files.get({
      fileId: effectiveFileId,
      fields: 'mimeType, name, shortcutDetails',
    });

    let fileMetadata = metadataResponse.data;

    if (fileMetadata.mimeType === GOOGLE_DOCS_MIME_TYPES.SHORTCUT) {
      if (!fileMetadata.shortcutDetails?.targetId) {
        throw new Error('Shortcut is broken or target ID is missing.');
      }
      effectiveFileId = fileMetadata.shortcutDetails.targetId;
      const targetMetadataResponse = await drive.files.get({
        fileId: effectiveFileId,
        fields: 'mimeType, name',
      });
      fileMetadata = targetMetadataResponse.data;
    }

    const { mimeType, name } = fileMetadata;
    let response: any;
    let responseMimeType = mimeType || 'application/octet-stream';

    if (Object.values(GOOGLE_DOCS_MIME_TYPES).includes(mimeType || '')) {
      response = await drive.files.export(
        { fileId: effectiveFileId, mimeType: 'application/pdf' },
        { responseType: 'arraybuffer' }
      );
      responseMimeType = 'application/pdf';
    } else {
      response = await drive.files.get(
        { fileId: effectiveFileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
    }

    const arrayBuffer = response.data as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': responseMimeType,
        'Content-Disposition': `inline; filename="${name}"`,
      },
    });

  } catch (error: any) {
    console.error('Failed to fetch file from Google Drive:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch file from Google Drive', 
        details: errorMessage
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE handler for deleting a file
export async function DELETE(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({ fileId });
    return new NextResponse(null, { status: 204 }); // 204 No Content on success
  } catch (error: any) {
    console.error('Failed to delete file from Google Drive:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to delete file from Google Drive', 
        details: errorMessage
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
