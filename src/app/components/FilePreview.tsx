'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton, Alert } from '@mui/material';
import { AppFile } from './FileList';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface FilePreviewProps {
  file: AppFile | null;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setFileBlob(null);
    setPreviewError(null);

    if (file) {
      setIsLoading(true);
      fetch(`/api/files/${file.id}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ details: 'Failed to parse error response.' }));
            throw new Error(errorData.details || 'Failed to download file.');
          }
          return res.blob();
        })
        .then(blob => {
          setFileBlob(blob);
        })
        .catch(err => {
          console.error("Error fetching file for preview:", err);
          setPreviewError(err.message);
          setFileBlob(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePreviousPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (numPages && pageNumber < numPages) setPageNumber(pageNumber + 1);
  };

  const renderContent = () => {
    if (isLoading) {
      return <CircularProgress />;
    }

    if (previewError) {
      return <Alert severity="error">{`No se pudo cargar la vista previa: ${previewError}`}</Alert>;
    }

    if (!file) {
      return <Typography color="text.secondary">Selecciona un archivo para ver una vista previa</Typography>;
    }

    if ((file.type === 'pdf' || file.type === 'docx') && fileBlob) { // Allow docx to be previewed as PDF
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          <Document
            file={fileBlob}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<CircularProgress />}
            error={<Alert severity="error">Estructura de PDF inválida o archivo corrupto.</Alert>}
          >
            <Page pageNumber={pageNumber} />
          </Document>
          {numPages && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handlePreviousPage} disabled={pageNumber <= 1}>
                <NavigateBefore />
              </IconButton>
              <Typography>Página {pageNumber} de {numPages}</Typography>
              <IconButton onClick={handleNextPage} disabled={pageNumber >= numPages}>
                <NavigateNext />
              </IconButton>
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6">{file.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          La vista previa para este tipo de archivo no está soportada.
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto'
      }}
    >
      {renderContent()}
    </Paper>
  );
}