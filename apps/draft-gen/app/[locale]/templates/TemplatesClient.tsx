'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TemplateCard } from '@draft-gen/ui';
import VariableFormModal from '@/components/VariableFormModal';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
import { Database } from '@/lib/supabase/database.types';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/formatDate';

type Template = Database['public']['Tables']['templates']['Row'];

interface TemplatesClientProps {
  templates: Template[];
}

export default function TemplatesClient({ templates: initialTemplates }: TemplatesClientProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('templates');

  const handleGenerate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const handleDelete = (template: Template) => {
    setTemplateToDelete(template);
  };

  const handleCloseDeleteModal = () => {
    setTemplateToDelete(null);
  };

  const handleConfirmDelete = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // Remove template from state
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));

      toast({
        title: t('delete.success'),
        variant: 'default',
      });

      // Refresh the page to ensure consistency
      router.refresh();
    } catch {
      toast({
        title: t('delete.failure'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <VariableFormModal template={selectedTemplate} onClose={handleCloseModal} />

      <DeleteTemplateModal
        template={templateToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={(templateId) => router.push(`/generator?templateId=${templateId}`)}
            onGenerate={handleGenerate}
            onDelete={handleDelete}
            editLabel={t('card.edit')}
            generateLabel={t('card.generate')}
            deleteLabel={t('card.delete')}
            createdAtLabel={t('card.createdAt')}
            updatedAtLabel={t('card.updatedAt')}
            moreVariablesLabel={(count) => t('card.moreVariables', { count })}
            formatDate={formatDate}
          />
        ))}
      </div>
    </>
  );
}
