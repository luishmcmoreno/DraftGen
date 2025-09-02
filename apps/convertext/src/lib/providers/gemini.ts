import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider, GenerateResponse } from './base';
import { TextTools } from '../text-tools';
import type { ToolEvaluation } from '../../types/conversion';
import { logger } from '@draft-gen/logger';

export class GeminiProvider extends BaseLLMProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  private createPrompt(text: string, taskDescription: string, exampleOutput?: string): string {
    const tools = TextTools.getAvailableTools()
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    const exampleOutputSection =
      exampleOutput && exampleOutput.trim() ? `Example output (if provided): ${exampleOutput}` : '';

    return `You are an AI agent specialized in text conversion tasks. Your goal is to understand the user's request based on the description of the conversion needed to the text and a small sample of the text.
You should then select from the list of available tools, which tool to use to perform the conversion.
You only use the tools that are available to you.

Available tools:
${tools}

Task Description (what the user wants to do to the text):
${taskDescription}

${exampleOutputSection}

Based on the task description and available tools, determine which tool to use.
If using a tool, respond with the tool name, then each argument on a separate line as arg_name::<value> (arg_name must not contain spaces), and a short reasoning for why you chose that tool.
TOOL: <tool_name>
arg_name::<value>
arg_name::<value>
...
REASONING: <reasoning>`;
  }

  async generateResponse(
    text: string,
    taskDescription: string,
    exampleOutput?: string,
    toolUsed?: string,
    toolArgs?: string[]
  ): Promise<GenerateResponse> {
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
    try {
      const prompt = this.createPrompt(text, taskDescription, exampleOutput);
      logger.log('[GeminiProvider] Final prompt to Gemini:\n', prompt);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      logger.log('[GeminiProvider] LLM RESPONSE:\n', response);

      // Extract tool, arguments, and reasoning
      const toolMatch = response.match(/TOOL:\s*(\w+)/);
      const tool = toolMatch ? toolMatch[1] : 'custom';

      // Extract arguments (arg_name::<value>)
      const argPattern = /(\w+)::(.*)/g;
      const toolInput: string[] = [];
      let match;
      while ((match = argPattern.exec(response)) !== null) {
        if (match[1] !== 'REASONING') {
          toolInput.push(match[2].trim());
        }
      }

      const reasoningMatch = response.match(/REASONING:\s*([\s\S]*?)$/);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : response.trim();

      // Pair argument names with values
      const toolSignature = TextTools.getToolSignatures()[tool] || [];
      const toolArgs: { name: string; value: string }[] = [];

      for (let i = 0; i < toolSignature.length; i++) {
        const name = toolSignature[i];
        const value = i < toolInput.length ? toolInput[i] : '';
        if (name !== 'text') {
          // Skip the text parameter as it's provided separately
          toolArgs.push({ name, value });
        }
      }

      return {
        reasoning,
        tool,
        tool_args: toolArgs,
      };
    } catch (error) {
      logger.error('[GeminiProvider] Error during evaluation:', error);
      return {
        reasoning: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tool: 'custom',
        tool_args: [],
      };
    }
  }
}
