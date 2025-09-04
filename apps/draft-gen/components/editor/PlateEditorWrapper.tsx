'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlateEditor, type PlateEditorProps, type Value } from '@draft-gen/ui';
import { DocumentSchema } from '@/lib/dslValidator';
import { plateToDsl } from '@/utils/plate-to-dsl';
import { cn } from '@/lib/utils';

interface PlateEditorWrapperProps {
  initialValue?: Value;
  onChange?: (value: Value) => void;
  onDslUpdate?: (updater: (dsl: DocumentSchema) => DocumentSchema) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  dsl?: DocumentSchema;
  variant?: PlateEditorProps['variant'];
}

export function PlateEditorWrapper({
  initialValue,
  onChange,
  onDslUpdate,
  readOnly = false,
  placeholder = 'Start typing...',
  className = '',
  variant = 'default',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dsl,
}: PlateEditorWrapperProps) {
  // Use stable initial value for the editor
  // This prevents remounting on every render
  const [stableInitialValue] = useState(initialValue);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValueRef = useRef<Value | undefined>(initialValue);

  // Handle changes with debouncing
  const handleChange = useCallback(
    (newValue: Value) => {
      // Call the direct onChange if provided
      if (onChange) {
        onChange(newValue);
      }

      // Handle DSL updates with debouncing
      if (onDslUpdate) {
        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new debounced update
        debounceTimerRef.current = setTimeout(() => {
          // Only update if value actually changed
          if (JSON.stringify(newValue) !== JSON.stringify(lastValueRef.current)) {
            onDslUpdate((currentDsl) => {
              // Convert Plate value to DSL format, preserving variables
              const updatedDsl = plateToDsl(newValue, currentDsl.variables);
              return updatedDsl;
            });
            lastValueRef.current = newValue;
          }
        }, 500); // 500ms debounce delay
      }
    },
    [onChange, onDslUpdate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('plate-editor-wrapper', className)}>
      <PlateEditor
        initialValue={stableInitialValue}
        onChange={readOnly ? undefined : handleChange}
        readOnly={readOnly}
        placeholder={placeholder}
        variant={variant}
      />
    </div>
  );
}
