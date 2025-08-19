// Shared styles for document rendering
// Used by both Viewer (preview) and PdfPreview (PDF generation)

export const documentStyles = {
  page: {
    width: '794px', // A4 width at 96 DPI
    minHeight: '1123px', // A4 height at 96 DPI
    padding: '80px 60px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    lineHeight: '1.6',
    boxSizing: 'border-box' as const,
    margin: '1rem auto',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.15)',
  },
  
  paragraph: {
    margin: '0.75rem 0',
    lineHeight: '1.6',
    color: '#000000',
    fontSize: '14px',
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