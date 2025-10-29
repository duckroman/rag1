'use client';

import { useState, useCallback, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, IconButton, Collapse, CircularProgress, Alert } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';

export interface AppFile {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'jpg' | 'png' | 'unknown';
}

// Dynamically import components to avoid SSR issues with client-side libraries
const FileDropzone = dynamic(() => import('./components/FileDropzone'), { ssr: false });
const FileList = dynamic(() => import('./components/FileList'), { ssr: false });
const FilePreview = dynamic(() => import('./components/FilePreview'), { ssr: false });
const Chat = dynamic(() => import('./components/Chat'), { ssr: false });


export default function Home() {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AppFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFileSectionExpanded, setIsFileSectionExpanded] = useState(true);
  const [isChatSectionExpanded, setIsChatSectionExpanded] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data.files);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'File upload failed');
      }

      await fetchFiles(); // Refresh file list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, [fetchFiles]);

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      setFiles(files => files.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelect = (file: AppFile) => {
    setSelectedFile(file);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3} sx={{ height: 'calc(100vh - 100px)' }}>
        {/* Files & Preview Section */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Mis Documentos
              </Typography>
              <IconButton onClick={() => setIsFileSectionExpanded(!isFileSectionExpanded)}>
                {isFileSectionExpanded ? <CloseIcon /> : <UploadFileIcon />}
              </IconButton>
            </Box>
            <Collapse in={isFileSectionExpanded}>
              <FileDropzone onDrop={handleDrop} isUploading={isUploading} />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {loadingFiles ? <CircularProgress sx={{ mt: 4, mx: 'auto' }} /> : <FileList files={files} onDelete={handleDelete} onSelect={handleSelect} selectedFileId={selectedFile?.id || null} />}
            </Collapse>
          </Paper>
        </Grid>

        {/* Chat & Preview Section */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={3} direction="column" sx={{ flexGrow: 1 }}>
            <Grid item xs>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Chat
                  </Typography>
                  <IconButton onClick={() => setIsChatSectionExpanded(!isChatSectionExpanded)}>
                    {isChatSectionExpanded ? <CloseIcon /> : <ChatIcon />}
                  </IconButton>
                </Box>
                <Collapse in={isChatSectionExpanded} sx={{ flexGrow: 1, display: 'flex' }}>
                  <Chat />
                </Collapse>
              </Paper>
            </Grid>
            <Grid item xs>
              <FilePreview file={selectedFile} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
