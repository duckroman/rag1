'use client';
import { List, ListItemButton, ListItemAvatar, Avatar, ListItemText, IconButton, Typography, Box } from '@mui/material';
import { Description, PictureAsPdf, Image, Delete } from '@mui/icons-material';

// Define the structure of a file object
export interface AppFile {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'jpg' | 'png';
}

interface FileListProps {
  files: AppFile[];
  onDelete: (fileId: string) => void;
  onSelect: (file: AppFile) => void;
  selectedFileId: string | null;
}

const getFileIcon = (type: AppFile['type']) => {
  switch (type) {
    case 'pdf':
      return <PictureAsPdf />;
    case 'jpg':
    case 'png':
      return <Image />;
    default:
      return <Description />;
  }
};

export default function FileList({ files, onDelete, onSelect, selectedFileId }: FileListProps) {
  if (files.length === 0) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Aún no hay archivos.</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ mt: 2 }}>
      {files.map((file) => (
        <ListItemButton
          key={file.id}
          selected={selectedFileId === file.id}
          onClick={() => onSelect(file)}
          sx={{
            borderRadius: 1,
            mb: 1,
            boxShadow: 1,
          }}
        >
          <ListItemAvatar>
            <Avatar>{getFileIcon(file.type)}</Avatar>
          </ListItemAvatar>
          <ListItemText primary={file.name} />
          <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}>
            <Delete />
          </IconButton>
        </ListItemButton>
      ))}
    </List>
  );
}