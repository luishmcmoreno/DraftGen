'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { extractVariablesTyped, ExtractedVariable } from '@/utils/extractVariablesTyped';
import { substituteVariables } from '@/utils/substituteVariables';
import { validateAllVariables, formatVariableValue } from '@/utils/validateVariableValue';
import { Database } from '@/lib/supabase/database.types';
import { DocumentSchema } from '@/lib/dslValidator';
import PrintPreviewModal from './PrintPreviewModal';
import TextVariableInput from './variables/TextVariableInput';
import DateVariableInput from './variables/DateVariableInput';
import EmailVariableInput from './variables/EmailVariableInput';
import NumberVariableInput from './variables/NumberVariableInput';
import PhoneVariableInput from './variables/PhoneVariableInput';

type Template = Database['public']['Tables']['templates']['Row'];

interface VariableFormModalProps {
  template: Template | null;
  onClose: () => void;
}

export default function VariableFormModal({ template, onClose }: VariableFormModalProps) {
  const t = useTranslations('templates.generate');
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [filledContent, setFilledContent] = useState<DocumentSchema | null>(null);
  const [typedVariables, setTypedVariables] = useState<ExtractedVariable[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) {
      // Get typed variables
      const typed = extractVariablesTyped(template.json);
      setTypedVariables(typed);

      // Initialize values
      const initialValues: Record<string, string> = {};
      const initialErrors: Record<string, string | null> = {};
      typed.forEach((v) => {
        initialValues[v.name] = v.defaultValue || '';
        initialErrors[v.name] = null;
      });
      setValues(initialValues);
      setErrors(initialErrors);

      // Initialize with empty values to show preview
      setFilledContent(template.json as DocumentSchema);
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

  const handleInputChange = (variableName: string, value: string) => {
    const newValues = { ...values, [variableName]: value };
    setValues(newValues);

    // Format value based on type before substitution
    const formattedValues: Record<string, string> = {};
    typedVariables.forEach((v) => {
      const val = newValues[v.name] || '';
      formattedValues[v.name] = formatVariableValue(v, val);
    });

    // Update preview in real-time
    const updatedContent = substituteVariables(template.json, formattedValues);
    setFilledContent(updatedContent);
  };

  const handleVariableError = (variableName: string, error: string | null) => {
    setErrors((prev) => ({ ...prev, [variableName]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateAllVariables(typedVariables, values);
    if (validationErrors.length > 0) {
      // Update error state
      const errorMap: Record<string, string | null> = {};
      validationErrors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);

      // Focus on first error field
      const firstError = validationErrors[0];
      const element = document.getElementById(firstError.field);
      element?.focus();
      return;
    }

    // Format values before substitution
    const formattedValues: Record<string, string> = {};
    typedVariables.forEach((v) => {
      formattedValues[v.name] = formatVariableValue(v, values[v.name] || '');
    });

    // Fill the template with formatted values
    const filledDsl = substituteVariables(template.json, formattedValues);
    // console.log('Filled DSL:', filledDsl);
    setFilledContent(filledDsl);

    // Show the print preview modal
    setShowPrintPreview(true);
  };

  const renderVariableInput = (variable: ExtractedVariable) => {
    const commonProps = {
      variable,
      value: values[variable.name] || '',
      onChange: (value: string) => handleInputChange(variable.name, value),
      onError: (error: string | null) => handleVariableError(variable.name, error),
    };

    switch (variable.type) {
      case 'DATE':
        return <DateVariableInput key={variable.name} {...commonProps} />;
      case 'EMAIL':
        return <EmailVariableInput key={variable.name} {...commonProps} />;
      case 'NUMBER':
        return <NumberVariableInput key={variable.name} {...commonProps} />;
      case 'PHONE':
        return <PhoneVariableInput key={variable.name} {...commonProps} />;
      case 'TEXT':
      default:
        return <TextVariableInput key={variable.name} {...commonProps} />;
    }
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
          <div
            ref={modalRef}
            className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">
                {t('modal.title')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {typedVariables.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No variables found in this template.
                  </p>
                ) : (
                  typedVariables.map((variable) => (
                    <div key={variable.name}>
                      <label
                        htmlFor={variable.name}
                        className="block text-sm font-medium text-card-foreground mb-1"
                      >
                        {variable.label || variable.name}
                        {!variable.required && (
                          <span className="text-muted-foreground text-xs ml-1">
                            (optional)
                          </span>
                        )}
                      </label>
                      {renderVariableInput(variable)}
                    </div>
                  ))
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      typedVariables.length === 0 || Object.values(errors).some((e) => e !== null)
                    }
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
