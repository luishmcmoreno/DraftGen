'use client';

import { useState } from 'react';
import TemplateCard from '@/components/TemplateCard';
import VariableFormModal from '@/components/VariableFormModal';
import { Database } from '@/lib/supabase/database.types';

type Template = Database['public']['Tables']['templates']['Row'];

interface TemplatesClientProps {
  templates: Template[];
}

export default function TemplatesClient({ templates }: TemplatesClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleGenerate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <>
      <VariableFormModal
        template={selectedTemplate}
        onClose={handleCloseModal}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onGenerate={handleGenerate}
          />
        ))}
      </div>
    </>
  );
}