'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { extractVariables } from '@/utils/extractVariables';
import { substituteVariables } from '@/utils/substituteVariables';
import { Database } from '@/lib/supabase/database.types';
import { usePDF } from 'react-to-pdf';
import PdfPreview from './PdfPreview';

type Template = Database['public']['Tables']['templates']['Row'];

interface VariableFormModalProps {
  template: Template | null;
  onClose: () => void;
}

export default function VariableFormModal({ template, onClose }: VariableFormModalProps) {
  const t = useTranslations('templates.generate');
  const [values, setValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [filledContent, setFilledContent] = useState<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Setup react-to-pdf with proper configuration
  const { toPDF, targetRef } = usePDF({
    filename: template ? `${template.name}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.pdf` : 'document.pdf',
    method: 'save',
    canvas: {
      mimeType: 'image/png',
      qualityRatio: 1
    },
    page: {
      margin: 10,
      format: 'a4',
      orientation: 'portrait'
    }
  });

  useEffect(() => {
    if (template) {
      const variables = extractVariables(template.json);
      const initialValues: Record<string, string> = {};
      variables.forEach(v => {
        initialValues[v] = '';
      });
      setValues(initialValues);
      // Initialize with empty values to show preview
      setFilledContent(template.json);
    }
  }, [template]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!template) return null;

  const variables = extractVariables(template.json);

  const handleInputChange = (variable: string, value: string) => {
    const newValues = { ...values, [variable]: value };
    setValues(newValues);
    // Update preview in real-time
    const updatedContent = substituteVariables(template.json, newValues);
    setFilledContent(updatedContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Fill the template with values
      const filledDsl = substituteVariables(template.json, values);
      setFilledContent(filledDsl);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate PDF using react-to-pdf
      await toPDF();
      
      // Wait a bit before closing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Close modal after successful generation
      onClose();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(t('failure'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Hidden PDF Preview for generation */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px', 
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <div ref={targetRef} style={{ display: 'inline-block' }}>
          <PdfPreview content={filledContent || template.json} />
        </div>
      </div>

      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('modal.title')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {variables.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No variables found in this template.
                </p>
              ) : (
                variables.map((variable) => (
                  <div key={variable}>
                    <label
                      htmlFor={variable}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {variable}
                    </label>
                    <input
                      type="text"
                      id={variable}
                      value={values[variable] || ''}
                      onChange={(e) => handleInputChange(variable, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                      required
                    />
                  </div>
                ))
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || variables.length === 0}
                  className="flex-1 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? '...' : t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}