'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import type { AppFile } from '../page';

// Configure the PDF.js worker. This is the crucial step.
// It points to the worker file that should be in your public directory.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FilePreviewProps {
  file: AppFile | null;
}

const FilePreview = ({ file }: FilePreviewProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!file) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed grey', borderRadius: 1, p: 2 }}>
        <Typography>Selecciona un archivo para previsualizarlo</Typography>
      </Box>
    );
  }

  const fileUrl = `/api/files/${file.id}`;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('Error loading document:', error.message)}
        loading={<CircularProgress />}
        error={<Alert severity="error">No se pudo cargar la previsualización del PDF.</Alert>}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} renderTextLayer={false} />
        ))}
      </Document>
    </Box>
  );
};

export default FilePreview;