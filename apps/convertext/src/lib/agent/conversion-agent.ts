import { BaseLLMProvider } from '../providers/base';
import { TextTools } from '../text-tools';
import type { ToolEvaluation } from '../../types/conversion';
import { logger } from '@draft-gen/logger';

export interface ProcessRequestParams {
  text: string;
  taskDescription: string;
  exampleOutput?: string;
  toolArgs?: string[];
}

export interface ProcessRequestResult {
  original_text: string;
  converted_text: string;
  diff: string;
  tool_used: string;
  render_mode: 'diff' | 'output';
  tool_args: { name: string; value: string }[];
  error?: string;
  confidence: number;
}

export class ConversionAgent {
  constructor(private provider: BaseLLMProvider) {}

  async processRequest({
    text,
    taskDescription,
    exampleOutput,
    toolArgs,
  }: ProcessRequestParams): Promise<ProcessRequestResult> {
    try {
      // First, evaluate the task to determine which tool to use
      const evalResult = await this.provider.evaluateTask(text, taskDescription, exampleOutput);

      const toolUsed = evalResult.tool;

      // Get tool arguments from evaluation or use provided args
      const toolArgsFromLLM = evalResult.tool_args.map((arg) => arg.value);
      const finalToolArgs = toolArgsFromLLM.length > 0 ? toolArgsFromLLM : toolArgs || [];

      // Execute the conversion using the selected tool
      const providerResult = await this.provider.generateResponse(
        text,
        taskDescription,
        exampleOutput,
        toolUsed,
        finalToolArgs
      );

      const convertedText = providerResult.converted_text || 'Error: Conversion failed';
      const actualToolUsed = providerResult.tool_used || 'Conversion Agent';
      const error = providerResult.error;

      // Determine render mode based on the tool
      const toolInfo = TextTools.getAvailableTools().find((t) => t.name === actualToolUsed);
      const renderMode = toolInfo?.renderMode || 'diff';

      // Generate diff if needed
      let diff = '';
      if (renderMode === 'diff' && !error) {
        diff = TextTools.generateDiff(text, convertedText);
      }

      // Structure tool arguments for response
      const toolSignature = TextTools.getToolSignatures()[toolUsed] || [];
      const structuredToolArgs: { name: string; value: string }[] = [];

      for (let i = 0; i < toolSignature.length; i++) {
        const name = toolSignature[i];
        if (name !== 'text') {
          // Skip the text parameter
          const value = i - 1 < finalToolArgs.length ? finalToolArgs[i - 1] : '';
          structuredToolArgs.push({ name, value });
        }
      }

      return {
        original_text: text,
        converted_text: convertedText,
        diff,
        tool_used: actualToolUsed,
        render_mode: renderMode,
        tool_args: structuredToolArgs,
        error,
        confidence: error ? 0 : 1, // Simple confidence: 0 if error, 1 if success
      };
    } catch (error) {
      logger.error('Error during agent processing:', error);
      return {
        original_text: text,
        converted_text: text,
        diff: '',
        tool_used: 'error',
        render_mode: 'diff',
        tool_args: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        confidence: 0,
      };
    }
  }

  async evaluateTask(
    text: string,
    taskDescription: string,
    exampleOutput?: string
  ): Promise<ToolEvaluation> {
    return this.provider.evaluateTask(text, taskDescription, exampleOutput);
  }
}
