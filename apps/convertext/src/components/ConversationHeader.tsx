import React from 'react';

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
    <div className="bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Title with Icon */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                {title}
              </h1>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm text-slate-500">
                Transform your text and data with AI-powered conversion routines
              </span>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-2">
            {onOpenWorkflowLibrary && (
              <button
                onClick={onOpenWorkflowLibrary}
                className="px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                disabled={loading}
                title="View Saved Routines"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
            )}

            {onSaveWorkflow && (
              <button
                onClick={onSaveWorkflow}
                className="px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                disabled={loading}
                title="Save Workflow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            
            {hasEntries && (
              <button
                onClick={onClearConversation}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={loading}
                title="Clear Routine"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
            <button
              onClick={onNewConversation}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              disabled={loading}
              title="Clear Current Routine"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
