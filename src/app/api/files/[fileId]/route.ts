import { NextResponse } from 'next/server';
import { getGoogleDriveClient } from '@/lib/google-drive';

const GOOGLE_DOCS_MIME_TYPES = {
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  SHORTCUT: 'application/vnd.google-apps.shortcut',
};

// GET handler for fetching file content for preview
export async function GET(request: Request, context: { params: { fileId: string } }) {
  // WORKAROUND: Manually parse fileId from the URL.
  const urlParts = request.url.split('/');
  const fileId = urlParts[urlParts.length - 1];

  if (!fileId || fileId === 'files') {
    return new NextResponse(JSON.stringify({ error: 'File ID could not be parsed from URL.' }), { status: 400 });
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
    const errorDetails = error.response?.data?.error || { message: error.message };
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch file from Google Drive', 
        details: errorDetails.message || JSON.stringify(errorDetails) 
      }), 
      { status: error.response?.status || 500 }
    );
  }
}

// DELETE handler for deleting a file
export async function DELETE(request: Request, context: { params: { fileId: string } }) {
  // Use the same workaround to get the fileId
  const urlParts = request.url.split('/');
  const fileId = urlParts[urlParts.length - 1];

  if (!fileId) {
    return new NextResponse(JSON.stringify({ error: 'File ID is required' }), { status: 400 });
  }

  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({ fileId });
    return new NextResponse(null, { status: 204 }); // 204 No Content on success
  } catch (error: any) {
    const errorDetails = error.response?.data?.error || { message: error.message };
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to delete file from Google Drive', 
        details: errorDetails.message || JSON.stringify(errorDetails) 
      }), 
      { status: error.response?.status || 500 }
    );
  }
}