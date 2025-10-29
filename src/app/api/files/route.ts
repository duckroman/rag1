import { NextResponse } from 'next/server';
import { getGoogleDriveClient } from '@/lib/google-drive';
import { Readable } from 'stream';

// Helper to map Google Drive file to our AppFile format
const mapGoogleFileToAppFile = (file: any) => {
  let type: 'pdf' | 'txt' | 'docx' | 'jpg' | 'png' = 'txt'; // default
  if (file.mimeType === 'application/vnd.google-apps.document') {
    type = 'pdf';
  } else {
    const extension = file.name?.split('.').pop().toLowerCase();
    if (['pdf', 'txt', 'docx', 'jpg', 'png'].includes(extension)) {
      type = extension as 'pdf' | 'txt' | 'docx' | 'jpg' | 'png';
    }
  }
  return { id: file.id, name: file.name, type: type };
};

// GET handler for listing files
export async function GET() {
  try {
    const drive = getGoogleDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];
    const appFiles = files.map(mapGoogleFileToAppFile);
    return NextResponse.json(appFiles);

  } catch (error: any) {
    const errorDetails = error.response?.data?.error || { message: error.message };
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch files', details: errorDetails.message || JSON.stringify(errorDetails) }), { status: 500 });
  }
}

// POST handler for uploading files
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No files were uploaded.' }), { status: 400 });
    }

    const drive = getGoogleDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const uploadedFiles = [];

    for (const file of files) {
      const fileBuffer = await file.arrayBuffer();
      const readableStream = new Readable();
      readableStream.push(Buffer.from(fileBuffer));
      readableStream.push(null);

      const response = await drive.files.create({
        requestBody: {
          name: file.name,
          parents: folderId ? [folderId] : [],
        },
        media: {
          mimeType: file.type,
          body: readableStream,
        },
        fields: 'id, name, mimeType',
      });
      uploadedFiles.push(response.data);
    }

    return NextResponse.json({ success: true, uploadedFiles });

  } catch (error: any) {
    const errorDetails = error.response?.data?.error || { message: error.message };
    return new NextResponse(JSON.stringify({ error: 'Failed to upload files', details: errorDetails.message || JSON.stringify(errorDetails) }), { status: 500 });
  }
}
