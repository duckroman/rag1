'use client';

import { useState, useCallback, useEffect } from 'react';
import { Container, Paper, Typography, Box, IconButton, Collapse, CircularProgress, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  const [isPreviewSectionExpanded, setIsPreviewSectionExpanded] = useState(true); // Renamed from isChatSectionExpanded
  const [visitsCount, setVisitsCount] = useState(0); // Initialize to 0, will be updated from localStorage

  useEffect(() => {
    // Increment visit count using localStorage
    if (typeof window !== 'undefined') {
      const currentVisits = parseInt(localStorage.getItem('visitsCount') || '0', 10);
      const newVisits = currentVisits + 1;
      localStorage.setItem('visitsCount', newVisits.toString());
      setVisitsCount(newVisits);
    }
  }, []); // Run only once on mount

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
    <Container
      maxWidth="xl"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }, // Responsive layout
        height: '100vh',
        p: 2,
        gap: 2,
        pb: { xs: '250px', md: 2 }, // Space for floating chat on mobile
        overflowY: { xs: 'auto', md: 'hidden' },
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: '100%', md: '30%' }, // Responsive width
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 2,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative', // For positioning the copyright
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Mis Archivos
          </Typography>
          <FileDropzone onDrop={handleDrop} isUploading={isUploading} />
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
            {loadingFiles ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FileList
                files={files}
                onDelete={handleDelete}
                onSelect={handleSelect}
                selectedFileId={selectedFile?.id || null}
              />
            )}
          </Box>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              color: 'text.disabled',
            }}
          >
            JRC 2025 &copy;
          </Typography>
        </Paper>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          width: { xs: '100%', md: '70%' }, // Responsive width
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Chatea Con Tus Documentos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Una nueva forma de interactuar con tu información.
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
            Visitas: {visitsCount}
          </Typography>
        </Box>

        {/* File Preview */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: { xs: '75vh', md: 'auto' }, // Responsive height
          }}
        >
          {selectedFile ? (
            <>
              <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
                Vista Previa: {selectedFile.name}
              </Typography>
              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <FilePreview file={selectedFile} />
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography>Selecciona un archivo para previsualizarlo</Typography>
            </Box>
          )}
        </Paper>

        {/* Chat - Floating on mobile, fixed at bottom on desktop */}
        <Paper
          elevation={8}
          sx={{
            borderRadius: 2,
            flexShrink: 0,
            height: { xs: 250, md: 200 }, // Responsive height
            position: { xs: 'fixed', md: 'relative' }, // Floating on mobile
            bottom: { xs: 0, md: 'auto' },
            left: { xs: 0, md: 'auto' },
            right: { xs: 0, md: 'auto' },
            width: { xs: '100%', md: 'auto' },
            zIndex: 1300,
          }}
        >
          <Box sx={{ height: '100%', overflow: 'hidden' }}>
            <Chat selectedFileName={selectedFile?.name} />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
