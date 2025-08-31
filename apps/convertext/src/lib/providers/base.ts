import type { ToolEvaluation } from '../../types/conversion';

export interface GenerateResponse {
  converted_text: string;
  tool_used: string;
  tool_args: string[];
  error?: string;
}

export abstract class BaseLLMProvider {
  abstract generateResponse(
    text: string,
    taskDescription: string,
    exampleOutput?: string,
    toolUsed?: string,
    toolArgs?: string[]
  ): Promise<GenerateResponse>;

  abstract evaluateTask(
    text: string,
    taskDescription: string,
    exampleOutput?: string
  ): Promise<ToolEvaluation>;
}