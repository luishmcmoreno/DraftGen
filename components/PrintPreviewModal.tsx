'use client';

import { DocumentSchema } from '@/lib/dslValidator';
import { Viewer } from './Viewer';

interface PrintPreviewModalProps {
  content: DocumentSchema;
  templateName: string;
  onClose: () => void;
}

export default function PrintPreviewModal({ content, templateName, onClose }: PrintPreviewModalProps) {
  const handlePrint = () => {
    window.print();
    // Optionally close after printing (you can remove this if you want to keep it open)
    // setTimeout(() => onClose(), 100);
  };

  return (
    <div className="print-preview-container fixed inset-0 bg-white dark:bg-gray-900 z-[9999] overflow-auto print:bg-white">
      {/* Header - hidden during print */}
      <div className="print-hide sticky top-0 bg-white dark:bg-gray-900 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Print Preview: {templateName}</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Print
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
      
      {/* Document content */}
      <Viewer dsl={content} />
    </div>
  );
}