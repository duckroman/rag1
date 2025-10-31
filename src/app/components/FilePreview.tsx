'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import type { AppFile } from '../page';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface FilePreviewProps {
  file: AppFile | null;
}

const FilePreview = ({ file }: FilePreviewProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    handleResize(); // Set initial width
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!file) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          border: '1px dashed grey',
          borderRadius: 1,
          p: 2,
        }}
      >
        <Typography>Selecciona un archivo para previsualizarlo</Typography>
      </Box>
    );
  }

  const fileUrl = `/api/files/${file.id}`;

  return (
    <Box ref={containerRef} sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
      {containerWidth > 0 && (
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error('Error loading document:', error.message);
          }}
          loading={<CircularProgress />}
          error={<Alert severity="error">No se pudo cargar la previsualización del PDF.</Alert>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer={false}
              width={containerWidth} // Make page responsive
            />
          ))}
        </Document>
      )}
    </Box>
  );
};

export default FilePreview;