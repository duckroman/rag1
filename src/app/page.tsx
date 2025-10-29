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
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, pb: '300px' }}> {/* Added padding-bottom to prevent overlap with fixed chat */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Chatea Con Tus Documentos
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Una nueva forma de interactuar con tu información.
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
            Visitas: {visitsCount}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, position: 'fixed', top: 20, right: 20, zIndex: 9999 }} onClose={() => setError(null)}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
              Mis Archivos
            </Typography>
            <IconButton onClick={() => setIsFileSectionExpanded(!isFileSectionExpanded)} size="small">
              {isFileSectionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={isFileSectionExpanded}>
            <FileDropzone onDrop={handleDrop} isUploading={isUploading} />
            {loadingFiles ? <CircularProgress sx={{ mt: 4 }} /> : <FileList files={files} onDelete={handleDelete} onSelect={handleSelect} selectedFileId={selectedFile?.id || null} />}
          </Collapse>
        </Paper>

        {selectedFile && (
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Vista Previa: {selectedFile.name}
              </Typography>
              <IconButton onClick={() => setIsPreviewSectionExpanded(!isPreviewSectionExpanded)} size="small">
                {isPreviewSectionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isPreviewSectionExpanded}>
              <Box sx={{ height: '70vh' }}>
                <FilePreview file={selectedFile} />
              </Box>
            </Collapse>
          </Paper>
        )}
      </Container>

      {/* Always visible and fixed Chat component */}
      <Container maxWidth="lg" sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none', // Allows interaction with elements behind it
      }}>
        <Paper elevation={8} sx={{
          width: '100%', // Take full width of the container
          height: 300, // Fixed height for the chat section
          borderRadius: '16px 16px 0 0', // Rounded top corners
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto', // Re-enable interaction for the chat itself
        }}>
          {/* The chat title and message count are now handled within the Chat component */}
          <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
            <Chat />
          </Box>
        </Paper>
      </Container>
    </>
  );
}
