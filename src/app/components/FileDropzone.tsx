'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const DropzoneContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'isUploading',
})(({ theme, isDragActive, isUploading }) => ({
  padding: theme.spacing(4),
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[400]}`,
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  cursor: isUploading ? 'not-allowed' : 'pointer',
  transition: 'border-color 0.3s',
  backgroundColor: isUploading ? theme.palette.action.disabledBackground : (isDragActive ? theme.palette.action.hover : 'transparent'),
  '&:hover': {
    borderColor: isUploading ? undefined : theme.palette.primary.main,
  },
}));

interface FileDropzoneProps {
  onUploadComplete: () => void;
}

export default function FileDropzone({ onUploadComplete }: FileDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadError(null);

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
        throw new Error(errorData.details || 'Error al subir los archivos.');
      }
      
      onUploadComplete(); // Notify parent to refresh file list

    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 3,
    disabled: isUploading,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': [],
      'image/png': [],
    },
  });

  return (
    <Box>
      <DropzoneContainer {...getRootProps({ isDragActive, isUploading })}>
        <input {...getInputProps()} />
        {isUploading ? (
          <Box>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Subiendo archivos...</Typography>
          </Box>
        ) : (
          <Box>
            <UploadFileIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
            <Typography>Arrastra y suelta hasta 3 archivos aquí, o haz clic para seleccionar</Typography>
          </Box>
        )}
      </DropzoneContainer>
      {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
    </Box>
  );
}