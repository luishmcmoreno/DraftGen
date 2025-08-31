'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@draft-gen/ui';
import { Database } from '@/lib/supabase/database.types';

type Template = Database['public']['Tables']['templates']['Row'];

interface DeleteTemplateModalProps {
  template: Template | null;
  onClose: () => void;
  onConfirm: (templateId: string) => Promise<void>;
}

export default function DeleteTemplateModal({
  template,
  onClose,
  onConfirm,
}: DeleteTemplateModalProps) {
  const t = useTranslations('templates.delete');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!template) return;

    setIsDeleting(true);
    await onConfirm(template.id);
    setIsDeleting(false);
    onClose();
  };

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('modal.title')}</DialogTitle>
          <DialogDescription>
            {t('modal.description', { name: template?.name || '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            {t('cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? '...' : t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
