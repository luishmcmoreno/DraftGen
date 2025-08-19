// Shared styles for document rendering
// Used by both Viewer (preview) and PdfPreview (PDF generation)

export const documentStyles = {
  page: {
    width: '794px', // A4 width at 96 DPI (210mm)
    height: '1123px', // Fixed A4 height at 96 DPI (297mm)
    padding: '72px', // 1 inch margins all around
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'Arial, Helvetica, sans-serif', // Use standard fonts for consistency
    fontSize: '12pt', // Standard document font size
    lineHeight: '1.5',
    boxSizing: 'border-box' as const,
    margin: '0 auto 2rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    position: 'relative' as const,
    overflow: 'hidden' as const, // Hide content that exceeds page height
    display: 'flex' as const,
    flexDirection: 'column' as const,
  },
  
  paragraph: {
    margin: '0 0 1em 0', // Standard paragraph spacing
    lineHeight: '1.5',
    color: '#000000',
    fontSize: '12pt', // Match page font size
    fontFamily: 'inherit',
  },
  
  variable: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    backgroundColor: '#dbeafe', // blue-100
    color: '#1e40af', // blue-800
    margin: '0 0.25rem',
  }
};

export const documentClassNames = {
  page: 'document-page',
  paragraph: 'document-paragraph',
  variable: 'document-variable',
};