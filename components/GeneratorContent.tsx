'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChatPanel } from '@/components/ChatPanel';
import { Viewer } from '@/components/Viewer';
import { createClient } from '@/lib/supabase/client';
import { DocumentSchema } from '@/lib/dslValidator';
import { extractVariables } from '@/utils/extractVariables';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { SaveTemplateModal } from '@/components/SaveTemplateModal';
import { useToast } from '@/hooks/use-toast';

export function GeneratorContent() {
  const t = useTranslations('generator');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const [currentDsl, setCurrentDsl] = useState<DocumentSchema | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const loadTemplate = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: t('load.failure'),
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      setCurrentDsl(data.json as DocumentSchema);
      setTemplateName(data.name);
      toast({
        title: t('load.success'),
        description: t('load.successDescription', { name: data.name }),
      });
    }
  }, [t, toast]);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId, loadTemplate]);

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);

    try {
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          existingJson: currentDsl 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('chat.error.invalidJson'));
      }

      setCurrentDsl(data.json);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('chat.success') 
      }]);
    } catch (error) {
      toast({
        title: t('chat.error.title'),
        description: error instanceof Error ? error.message : t('chat.error.invalidJson'),
        variant: 'destructive',
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('chat.error.invalidJson') 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async (name: string, description: string) => {
    if (!currentDsl) return;

    const supabase = createClient();
    const variables = extractVariables(currentDsl);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('save.failure'),
        description: t('save.notAuthenticated'),
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('templates')
      .insert({
        owner_id: user.id,
        name,
        description,
        json: currentDsl,
        tags: variables.slice(0, 10),
      });

    if (error) {
      toast({
        title: t('save.failure'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('save.success'),
        description: t('save.successDescription', { name }),
      });
      setTemplateName(name);
      setIsSaveModalOpen(false);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-64px)] flex">
        {/* Left Panel - Chat (22.5%) */}
        <div className="w-[22.5%] border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-medium">{t('title')}</h2>
            {currentDsl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSaveModalOpen(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('save.cta')}
              </Button>
            )}
          </div>
          <ChatPanel
            messages={messages}
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Viewer (77.5%) */}
        <div className="w-[77.5%] bg-muted/30 flex flex-col">
          <Viewer dsl={currentDsl} className="flex-1" />
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
        defaultName={templateName}
      />
    </>
  );
}