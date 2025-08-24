'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
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
import { ConversationMessage } from '@/lib/supabase/database.types';

export function GeneratorContent() {
  console.log('Rendering GeneratorContent'); // Debug log
  const t = useTranslations('generator');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const templateId = searchParams.get('templateId');
  const [currentDsl, setCurrentDsl] = useState<DocumentSchema | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const loadedTemplateIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      // If no template, we're not in initial load mode
      setIsInitialLoad(false);
      loadedTemplateIdRef.current = null;
      return;
    }

    // Only load if we haven't loaded this specific template yet
    if (loadedTemplateIdRef.current === templateId) {
      console.log('Template already loaded, skipping:', templateId);
      return;
    }

    const loadTemplate = async (id: string) => {
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
        const loadedDsl = data.json as DocumentSchema;
        setCurrentDsl(loadedDsl);
        setTemplateName(data.name);
        setTemplateDescription(data.description || '');
        setHasUnsavedChanges(false);
        
        // Load conversation history
        try {
          const response = await fetch(`/api/conversation-history?templateId=${id}`);
          const historyData = await response.json();
          
          if (historyData.history?.messages) {
            // Set the messages from history
            setMessages(historyData.history.messages.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content
            })));
          }
          setIsInitialLoad(false); // Mark initial load as complete
        } catch {
          // Silently fail loading history
          setIsInitialLoad(false);
        }
        
        // Mark this template as loaded to prevent duplicate toasts
        loadedTemplateIdRef.current = id;
        
        console.log('Loaded template:', data.name, id); // Debug log

        toast({
          title: t('load.success'),
          description: t('load.successDescription', { name: data.name }),
        });
      }
    };

    loadTemplate(templateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

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
      setHasUnsavedChanges(true);
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

  // Save conversation history when messages change (but not on initial load)
  useEffect(() => {
    // Skip saving on initial load or when no template/messages
    if (!templateId || messages.length === 0 || isInitialLoad) return;

    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      const messagesWithTimestamp: ConversationMessage[] = messages.map(msg => ({
        ...msg,
        timestamp: new Date().toISOString()
      }));

      try {
        const response = await fetch('/api/conversation-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            messages: messagesWithTimestamp
          })
        });
        
        if (!response.ok) {
          await response.json();
          // Silently fail - conversation history is not critical
        }
      } catch {
        // Silently fail - conversation history is not critical
      }
    }, 1000); // Wait 1 second before saving

    return () => clearTimeout(timeoutId);
  }, [messages, templateId, isInitialLoad]);

  // Direct save for existing templates (no modal)
  const handleDirectSave = async () => {
    if (!currentDsl || !templateId) return;

    const supabase = createClient();
    const variables = extractVariables(currentDsl);
    
    const { error } = await supabase
      .from('templates')
      .update({
        name: templateName,
        description: templateDescription,
        json: currentDsl,
        tags: variables.slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) {
      toast({
        title: t('save.failure'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('save.success'),
        description: t('save.successDescription', { name: templateName }),
      });
      setHasUnsavedChanges(false);
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

    // Check if we're updating an existing template or creating a new one
    if (templateId) {
      // Update existing template
      const { error } = await supabase
        .from('templates')
        .update({
          name,
          description,
          json: currentDsl,
          tags: variables.slice(0, 10),
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

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
        setTemplateDescription(description);
        setHasUnsavedChanges(false);
        setIsSaveModalOpen(false);
      }
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('templates')
        .insert({
          owner_id: user.id,
          name,
          description,
          json: currentDsl,
          tags: variables.slice(0, 10),
        })
        .select()
        .single();

      if (error) {
        toast({
          title: t('save.failure'),
          description: error.message,
          variant: 'destructive',
        });
      } else if (data) {
        // Save conversation history for the newly created template
        if (messages.length > 0) {
          const messagesWithTimestamp: ConversationMessage[] = messages.map(msg => ({
            ...msg,
            timestamp: new Date().toISOString()
          }));

          try {
            await fetch('/api/conversation-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                templateId: data.id,
                messages: messagesWithTimestamp
              })
            });
          } catch {
            // Silently fail - conversation history is not critical for template creation
          }
        }

        toast({
          title: t('save.success'),
          description: t('save.successDescription', { name }),
        });
        setTemplateName(name);
        setHasUnsavedChanges(false);
        setIsSaveModalOpen(false);
        
        // Update URL to include the new template ID for continued editing
        // This allows history persistence on subsequent messages
        const newUrl = `${pathname}?templateId=${data.id}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-65px)] flex">
        {/* Left Panel - Chat (22.5%) */}
        <div className="w-[22.5%] border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t('title')}</h2>
              {currentDsl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (templateId) {
                      // For existing templates, save directly
                      handleDirectSave();
                    } else {
                      // For new templates, show modal
                      setIsSaveModalOpen(true);
                    }
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('save.cta')}
                </Button>
              )}
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span>{t('unsavedChanges')}</span>
              </div>
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
          <Viewer 
            dsl={currentDsl} 
            className="flex-1"
            onDslUpdate={(updater) => {
              setCurrentDsl((prevDsl) => {
                if (!prevDsl) return prevDsl;
                const updated = updater(prevDsl);
                // Only set unsaved changes if the DSL actually changed
                if (JSON.stringify(updated) !== JSON.stringify(prevDsl)) {
                  setHasUnsavedChanges(true);
                }
                return updated;
              });
            }}
          />
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