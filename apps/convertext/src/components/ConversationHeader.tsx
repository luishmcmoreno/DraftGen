import React from 'react';
import { Button } from '@draft-gen/ui';
import { Zap, BookOpen, Save, Trash2, Plus } from 'lucide-react';

interface ConversationHeaderProps {
  title: string;
  provider: string;
  onProviderChange: (provider: string) => void;
  onNewConversation: () => void;
  onClearConversation: () => void;
  onSaveWorkflow?: () => void;
  hasEntries?: boolean;
  loading?: boolean;
  onOpenWorkflowLibrary?: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  title,
  provider,
  onProviderChange,
  onNewConversation,
  onClearConversation,
  onSaveWorkflow,
  hasEntries = false,
  loading = false,
  onOpenWorkflowLibrary
}) => {
  return (
    <div className="bg-card border-b border-border px-4 py-4 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Title with Icon */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-card-foreground">
                {title}
              </h1>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm text-muted-foreground">
                Transform your text and data with AI-powered conversion routines
              </span>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-2">
            {onOpenWorkflowLibrary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenWorkflowLibrary}
                disabled={loading}
                title="View Saved Routines"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            )}

            {onSaveWorkflow && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveWorkflow}
                disabled={loading}
                title="Save Workflow"
                className="text-success hover:text-success/80 hover:bg-success/10"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
            
            {hasEntries && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearConversation}
                disabled={loading}
                title="Clear Routine"
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewConversation}
              disabled={loading}
              title="Clear Current Routine"
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
