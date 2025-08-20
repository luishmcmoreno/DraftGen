'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { extractVariables } from '@/utils/extractVariables';
import { substituteVariables } from '@/utils/substituteVariables';
import { Database } from '@/lib/supabase/database.types';
import PrintPreviewModal from './PrintPreviewModal';

type Template = Database['public']['Tables']['templates']['Row'];

interface VariableFormModalProps {
  template: Template | null;
  onClose: () => void;
}

export default function VariableFormModal({ template, onClose }: VariableFormModalProps) {
  const t = useTranslations('templates.generate');
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [filledContent, setFilledContent] = useState<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fill the template with values
    const filledDsl = substituteVariables(template.json, values);
    console.log('Filled DSL:', filledDsl);
    setFilledContent(filledDsl);
    
    // Show the print preview modal
    setShowPrintPreview(true);
  };

  const handleCloseAll = () => {
    setShowPrintPreview(false);
    onClose();
  };

  return (
    <>
      {/* Print Preview Modal - shown after submitting the form */}
      {showPrintPreview && filledContent && (
        <PrintPreviewModal
          content={filledContent}
          templateName={template.name}
          onClose={handleCloseAll} // This will close both modals
        />
      )}

      {/* Variable Form Modal - shown first, hidden when print preview is open */}
      {!showPrintPreview && (
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
                  disabled={variables.length === 0}
                  className="flex-1 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </>
  );
}