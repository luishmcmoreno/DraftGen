import * as diff from 'diff';

export type ToolRenderMode = 'diff' | 'output';

export interface ToolSignature {
  name: string;
  description: string;
  renderMode: ToolRenderMode;
  params: string[];
}

export class TextTools {
  static toUppercase(text: string): string {
    return text.toUpperCase();
  }

  static toLowercase(text: string): string {
    return text.toLowerCase();
  }

  static capitalize(text: string): string {
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  static removeDuplicates(text: string): string {
    const lines = text.split('\n');
    const uniqueLines = Array.from(new Set(lines));
    return uniqueLines.join('\n');
  }

  static countWords(text: string): string {
    const count = text.trim().split(/\s+/).length;
    if (count === 1) {
      return "1 word found in the content.";
    }
    return `${count} words found in the content.`;
  }

  static countLines(text: string): string {
    const count = text.split('\n').length;
    if (count === 1) {
      return "1 line found in the content.";
    }
    return `${count} lines found in the content.`;
  }

  static generateDiff(original: string, modified: string): string {
    const patches = diff.createPatch('text', original, modified, '', '');
    return patches;
  }

  static csvToJson(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    if (!lines.length) {
      return '[]';
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return JSON.stringify(data, null, 2);
  }

  static searchAndReplace(text: string, search: string, replace: string): string {
    if (!search || search.length === 0 || search.length > 100) {
      return text;
    }
    return text.replaceAll(search, replace);
  }

  static extractEmails(text: string): string {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (!emails || emails.length === 0) {
      return "No email addresses found.";
    }
    return emails.join('\n');
  }

  static formatPhoneNumbers(text: string): string {
    const phonePatterns = [
      /\+?1?[-.]?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g,
      /([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      /\(?([0-9]{3})\)?\s?([0-9]{3})[-.\s]?([0-9]{4})/g
    ];
    
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    
    for (const line of lines) {
      let formattedLine = line;
      for (const pattern of phonePatterns) {
        formattedLine = formattedLine.replace(pattern, (match, p1, p2, p3) => {
          return `(${p1}) ${p2}-${p3}`;
        });
      }
      formattedLines.push(formattedLine);
    }
    
    return formattedLines.join('\n');
  }

  static convertEuropeanNumbers(text: string): string {
    // European numbers: digits with dots as thousand separators and comma as decimal
    const europeanPattern = /\b(\d{1,3}(?:\.\d{3})*),(\d{2})\b/g;
    
    let result = text.replace(europeanPattern, (match, thousands, decimal) => {
      const americanThousands = thousands.replace(/\./g, ',');
      return `${americanThousands}.${decimal}`;
    });
    
    // Also handle standalone comma decimals (like 15,5%)
    const standalonePattern = /\b(\d+),(\d+)\b/g;
    result = result.replace(standalonePattern, '$1.$2');
    
    return result;
  }

  static splitBySentences(text: string): string {
    // Simple sentence splitting on periods, exclamation marks, and question marks
    const sentences = text.trim().split(/[.!?]+\s+/);
    const resultSentences: string[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence) {
        // If it's not the last sentence and doesn't already end with punctuation, add a period
        if (i < sentences.length - 1 && !/[.!?]$/.test(sentence)) {
          resultSentences.push(sentence + '.');
        } else {
          resultSentences.push(sentence);
        }
      }
    }
    
    return resultSentences.join('\n');
  }

  static removeCsvColumns(text: string, columnsToRemove: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    if (!lines.length) {
      return text;
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const columnsToRemoveList = columnsToRemove.split(',').map(col => col.trim().toLowerCase());
    
    // Find indices of columns to keep
    const indicesToKeep: number[] = [];
    const newHeaders: string[] = [];
    
    headers.forEach((header, i) => {
      if (!columnsToRemoveList.includes(header.toLowerCase())) {
        indicesToKeep.push(i);
        newHeaders.push(header);
      }
    });
    
    if (indicesToKeep.length === 0) {
      return "Error: All columns would be removed.";
    }
    
    // Build result
    const resultLines: string[] = [];
    resultLines.push(newHeaders.join(','));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const newValues = indicesToKeep.map(index => 
        index < values.length ? values[index] : ''
      );
      resultLines.push(newValues.join(','));
    }
    
    return resultLines.join('\n');
  }

  static getAvailableTools(): ToolSignature[] {
    return [
      { name: 'toUppercase', description: 'Convert text to uppercase', renderMode: 'diff', params: ['text'] },
      { name: 'toLowercase', description: 'Convert text to lowercase', renderMode: 'diff', params: ['text'] },
      { name: 'capitalize', description: 'Capitalize the first letter of each word', renderMode: 'diff', params: ['text'] },
      { name: 'removeDuplicates', description: 'Remove duplicate lines', renderMode: 'diff', params: ['text'] },
      { name: 'countWords', description: 'Count words in text', renderMode: 'output', params: ['text'] },
      { name: 'countLines', description: 'Count lines in text', renderMode: 'output', params: ['text'] },
      { name: 'csvToJson', description: 'Convert CSV to JSON', renderMode: 'output', params: ['text'] },
      { name: 'searchAndReplace', description: 'Search and replace a single phrase (up to 100 chars)', renderMode: 'diff', params: ['text', 'search', 'replace'] },
      { name: 'extractEmails', description: 'Extract all email addresses from text', renderMode: 'output', params: ['text'] },
      { name: 'formatPhoneNumbers', description: 'Format phone numbers to (XXX) XXX-XXXX format', renderMode: 'diff', params: ['text'] },
      { name: 'convertEuropeanNumbers', description: 'Convert European number format to American format', renderMode: 'diff', params: ['text'] },
      { name: 'splitBySentences', description: 'Split text into separate lines by sentences', renderMode: 'diff', params: ['text'] },
      { name: 'removeCsvColumns', description: 'Remove specified columns from CSV data', renderMode: 'diff', params: ['text', 'columnsToRemove'] },
    ];
  }

  static getToolSignatures(): Record<string, string[]> {
    const signatures: Record<string, string[]> = {};
    const tools = this.getAvailableTools();
    
    tools.forEach(tool => {
      signatures[tool.name] = tool.params;
    });
    
    return signatures;
  }

  static executeTool(toolName: string, args: string[]): string {
    const method = (this as any)[toolName];
    if (typeof method === 'function') {
      return method.apply(this, args);
    }
    throw new Error(`Tool '${toolName}' is not available.`);
  }
}