import { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface DropzoneContainerProps {
  isDragActive: boolean;
  isUploading: boolean;
}

const DropzoneContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'isUploading',
})<DropzoneContainerProps>(({ theme, isDragActive, isUploading }) => ({
  padding: theme.spacing(4),
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[400]}`,
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  cursor: isUploading ? 'not-allowed' : 'pointer',
  transition: 'border .24s ease-in-out',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  opacity: isUploading ? 0.5 : 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
}));

interface FileDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  isUploading: boolean;
}

const FileDropzone = ({ onDrop, isUploading }: FileDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    maxFiles: 3,
  });

  const dropzoneContent = useMemo(() => {
    if (isUploading) {
      return <CircularProgress />;
    }
    return (
      <>
        <UploadFileIcon sx={{ fontSize: 50, mb: 2 }} />
        <Typography>Arrastra y suelta hasta 3 archivos aquí, o haz clic para seleccionarlos.</Typography>
      </>
    );
  }, [isUploading]);

  return (
    <DropzoneContainer {...getRootProps({ isDragActive, isUploading })}>
      <input {...getInputProps()} />
      {dropzoneContent}
    </DropzoneContainer>
  );
};

export default FileDropzone;