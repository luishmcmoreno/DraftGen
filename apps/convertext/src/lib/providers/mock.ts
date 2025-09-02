import { BaseLLMProvider, GenerateResponse } from './base';
import { TextTools } from '../text-tools';
import type { ToolEvaluation } from '../../types/conversion';
import { logger } from '@draft-gen/logger';

export class MockProvider extends BaseLLMProvider {
  async generateResponse(
    text: string,
    taskDescription: string,
    exampleOutput?: string,
    toolUsed?: string,
    toolArgs?: string[]
  ): Promise<GenerateResponse> {
    logger.log('[MockProvider] generate_response called with:', {
      text: text.substring(0, 100) + '...',
      taskDescription,
      toolUsed,
      toolArgs,
    });

    if (toolUsed && TextTools.getAvailableTools().find((t) => t.name === toolUsed)) {
      try {
        const args = [text, ...(toolArgs || [])];
        const converted = TextTools.executeTool(toolUsed, args);
        return {
          converted_text: converted,
          tool_used: toolUsed,
          tool_args: toolArgs || [],
          error: undefined,
        };
      } catch (error) {
        return {
          converted_text: text,
          tool_used: 'error',
          tool_args: toolArgs || [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    } else {
      return {
        converted_text: text,
        tool_used: 'error',
        tool_args: toolArgs || [],
        error: `Tool '${toolUsed}' is not available.`,
      };
    }
  }

  async evaluateTask(
    text: string,
    taskDescription: string,
    exampleOutput?: string
  ): Promise<ToolEvaluation> {
    logger.log('[MockProvider] evaluate_task called with:', {
      text: text.substring(0, 100) + '...',
      taskDescription,
      exampleOutput,
    });

    // Mock logic: select a tool based on simple keyword matching
    const lowerTask = taskDescription.toLowerCase();
    let tool = 'countWords'; // default

    if (lowerTask.includes('uppercase') || lowerTask.includes('upper case')) {
      tool = 'toUppercase';
    } else if (lowerTask.includes('lowercase') || lowerTask.includes('lower case')) {
      tool = 'toLowercase';
    } else if (lowerTask.includes('capitalize') || lowerTask.includes('title case')) {
      tool = 'capitalize';
    } else if (lowerTask.includes('duplicate') || lowerTask.includes('unique')) {
      tool = 'removeDuplicates';
    } else if (lowerTask.includes('word count') || lowerTask.includes('count words')) {
      tool = 'countWords';
    } else if (lowerTask.includes('line count') || lowerTask.includes('count lines')) {
      tool = 'countLines';
    } else if (lowerTask.includes('csv') && lowerTask.includes('json')) {
      tool = 'csvToJson';
    } else if (lowerTask.includes('email')) {
      tool = 'extractEmails';
    } else if (lowerTask.includes('phone')) {
      tool = 'formatPhoneNumbers';
    } else if (lowerTask.includes('european') && lowerTask.includes('number')) {
      tool = 'convertEuropeanNumbers';
    } else if (lowerTask.includes('sentence')) {
      tool = 'splitBySentences';
    } else if (lowerTask.includes('replace') || lowerTask.includes('substitute')) {
      tool = 'searchAndReplace';
    } else if (lowerTask.includes('remove') && lowerTask.includes('column')) {
      tool = 'removeCsvColumns';
    }

    const reasoning = `Based on the task description "${taskDescription}", the most appropriate tool is ${tool}.`;

    // Return empty tool_args for mock - the actual execution will determine what args are needed
    return {
      reasoning,
      tool,
      tool_args: [],
    };
  }
}
