'use client';

import { DocumentSchema } from '@/lib/dslValidator';
import { Viewer } from './Viewer';
import { useState } from 'react';
import { FileDown } from 'lucide-react';

interface PrintPreviewModalProps {
  content: DocumentSchema;
  templateName: string;
  onClose: () => void;
}

export default function PrintPreviewModal({
  content,
  templateName,
  onClose,
}: PrintPreviewModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // Import required libraries dynamically
      const { default: html2canvas } = await import('html2canvas-pro');

      // Find the entire viewer container (not just the editor)
      // This ensures we capture the content without affecting the editor state
      const viewerContainer =
        (document.querySelector(
          '.print-preview-container .bg-white.rounded-lg.shadow-soft'
        ) as HTMLElement) ||
        (document.querySelector('.print-preview-container .plate-editor-wrapper')
          ?.parentElement as HTMLElement);

      if (!viewerContainer) {
        throw new Error('Could not find document content');
      }

      // Create canvas from the viewer container
      const canvas = await html2canvas(viewerContainer, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 850, // Match the max-width of the viewer
      });

      // Convert to PDF using pdf-lib
      const PDFLib = await import('pdf-lib');
      const pdfDoc = await PDFLib.PDFDocument.create();

      // A4 dimensions in PDF points (1 point = 1/72 inch)
      const a4Width = 595.28;
      const a4Height = 841.89;

      // Add page and embed image
      const page = pdfDoc.addPage([a4Width, a4Height]);
      const pngImage = await pdfDoc.embedPng(canvas.toDataURL('image/png'));

      // Scale image to fit page while maintaining aspect ratio
      const imgDims = pngImage.scale(
        Math.min(a4Width / pngImage.width, a4Height / pngImage.height)
      );

      // Center image on page
      page.drawImage(pngImage, {
        x: (a4Width - imgDims.width) / 2,
        y: (a4Height - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
      const filename = `${templateName.replace(/\s+/g, '_')}_${date}_${time}.pdf`;

      // Save and download
      const pdfBytes = await pdfDoc.save();
      // Convert Uint8Array to ArrayBuffer for Blob
      const buffer = pdfBytes.buffer as ArrayBuffer;
      const blob = new Blob(
        [buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)],
        { type: 'application/pdf' }
      );
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      // Don't close modal - let user continue viewing or export again
    } catch {
      // Log error for debugging
      // console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="print-preview-container fixed inset-0 bg-white dark:bg-gray-900 z-[9999] overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Document Preview: {templateName}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Document content - readOnly to hide toolbar */}
      <div className="print-preview-content">
        <Viewer dsl={content} />
      </div>

      {/* CSS to hide toolbar in print preview */}
      <style jsx>{`
        .print-preview-content [data-plate-toolbar],
        .print-preview-content .sticky.top-0.z-50 {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
