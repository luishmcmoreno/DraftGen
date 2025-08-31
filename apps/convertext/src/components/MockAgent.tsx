import React from 'react';

interface AgentExplanationProps {
  provider: string;
  agentReasoning: string;
  selectedTool: string | null;
  loading: boolean;
}

export default function AgentExplanation({ provider, agentReasoning, selectedTool, loading }: AgentExplanationProps) {
  return (
    <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 border border-blue-600 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 drop-shadow">
        {provider.charAt(0).toUpperCase() + provider.slice(1)} Agent Analysis
      </h3>
      <div className="space-y-4">
        {agentReasoning ? (
          <div className="bg-card/90 border border-blue-300 rounded-md p-4 shadow">
            <h4 className="font-medium text-blue-800 mb-2">Agent Reasoning:</h4>
            <p className="text-sm text-blue-700">{agentReasoning}</p>
            {selectedTool && (
              <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                <span className="text-sm font-medium text-green-800">
                  Selected Tool: <code className="bg-green-200 px-1 rounded">{selectedTool}</code>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-white text-sm drop-shadow">
            {loading ? 'Analyzing...' : 'No agent reasoning available yet.'}
          </div>
        )}
      </div>
    </div>
  );
} 