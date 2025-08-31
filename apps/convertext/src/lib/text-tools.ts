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

  static removeExtraSpaces(text: string): string {
    return text.replace(/[ ]+/g, ' ').replace(/\t+/g, '\t');
  }

  static removeBlankLines(text: string): string {
    return text.split('\n').filter(line => line.trim()).join('\n');
  }

  static addLineNumbers(text: string): string {
    const lines = text.split('\n');
    return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
  }

  static addPrefix(text: string, prefix: string): string {
    if (!prefix) return text;
    const lines = text.split('\n');
    return lines.map(line => `${prefix}${line}`).join('\n');
  }

  static addSuffix(text: string, suffix: string): string {
    if (!suffix) return text;
    const lines = text.split('\n');
    return lines.map(line => `${line}${suffix}`).join('\n');
  }

  static reverseText(text: string): string {
    return text.split('').reverse().join('');
  }

  static repeatText(text: string, times: string): string {
    const repeatCount = parseInt(times, 10);
    if (isNaN(repeatCount) || repeatCount < 1 || repeatCount > 100) {
      return "Error: Repeat count must be a number between 1 and 100.";
    }
    return Array(repeatCount).fill(text).join('');
  }

  static shuffleWords(text: string): string {
    const words = text.trim().split(/\s+/);
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words.join(' ');
  }

  static shuffleLetters(text: string): string {
    return text.split('').map(char => {
      if (/\s/.test(char)) return char; // Keep whitespace
      return char;
    }).sort(() => Math.random() - 0.5).join('');
  }

  static shuffleParagraphs(text: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    for (let i = paragraphs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paragraphs[i], paragraphs[j]] = [paragraphs[j], paragraphs[i]];
    }
    return paragraphs.join('\n\n');
  }

  static invertCase(text: string): string {
    return text.split('').map(char => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      } else {
        return char.toUpperCase();
      }
    }).join('');
  }

  static randomizeCase(text: string): string {
    return text.split('').map(char => {
      if (/[a-zA-Z]/.test(char)) {
        return Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase();
      }
      return char;
    }).join('');
  }

  static joinWords(text: string, separator: string): string {
    const words = text.trim().split(/\s+/);
    return words.join(separator || ' ');
  }

  static splitWords(text: string): string {
    const words = text.trim().split(/\s+/);
    return words.join('\n');
  }

  static splitParagraphs(text: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    return paragraphs.map((p, i) => `Paragraph ${i + 1}:\n${p}`).join('\n\n---\n\n');
  }

  static extractUrls(text: string): string {
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls = text.match(urlPattern);
    if (!urls || urls.length === 0) {
      return "No URLs found.";
    }
    return urls.join('\n');
  }

  static extractNumbers(text: string): string {
    const numberPattern = /\b\d+(?:\.\d+)?\b/g;
    const numbers = text.match(numberPattern);
    if (!numbers || numbers.length === 0) {
      return "No numbers found.";
    }
    return numbers.join('\n');
  }

  static extractPhoneNumbers(text: string): string {
    const phonePatterns = [
      /\+?1?[-.]?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g,
      /([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      /\(?([0-9]{3})\)?\s?([0-9]{3})[-.\s]?([0-9]{4})/g
    ];
    
    const phoneNumbers = new Set<string>();
    
    for (const pattern of phonePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        phoneNumbers.add(match[0]);
      }
    }
    
    if (phoneNumbers.size === 0) {
      return "No phone numbers found.";
    }
    
    return Array.from(phoneNumbers).join('\n');
  }

  static extractRegexMatches(text: string, pattern: string): string {
    if (!pattern || pattern.length === 0) {
      return "Error: Regex pattern is required.";
    }
    
    try {
      const regex = new RegExp(pattern, 'g');
      const matches = text.match(regex);
      
      if (!matches || matches.length === 0) {
        return "No matches found for the given pattern.";
      }
      
      return matches.join('\n');
    } catch (error) {
      return "Error: Invalid regex pattern.";
    }
  }

  // Phase 4: Text Statistics & Analysis Tools
  static countCharacters(text: string): string {
    const totalChars = text.length;
    const charsWithoutSpaces = text.replace(/\s/g, '').length;
    const spaces = totalChars - charsWithoutSpaces;
    
    return `Total characters: ${totalChars}\nCharacters (no spaces): ${charsWithoutSpaces}\nSpaces: ${spaces}`;
  }

  static countSentences(text: string): string {
    const sentences = text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0);
    const count = sentences.length;
    
    if (count === 1) {
      return "1 sentence found in the content.";
    }
    return `${count} sentences found in the content.`;
  }

  static countParagraphs(text: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const count = paragraphs.length;
    
    if (count === 1) {
      return "1 paragraph found in the content.";
    }
    return `${count} paragraphs found in the content.`;
  }

  static getTextStatistics(text: string): string {
    const totalChars = text.length;
    const charsWithoutSpaces = text.replace(/\s/g, '').length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const lines = text.split('\n');
    
    return `📊 Text Statistics:
━━━━━━━━━━━━━━━━━━━━
📝 Characters: ${totalChars}
🔤 Characters (no spaces): ${charsWithoutSpaces}
📄 Words: ${words.length}
📋 Sentences: ${sentences.length}
📑 Paragraphs: ${paragraphs.length}
📏 Lines: ${lines.length}
━━━━━━━━━━━━━━━━━━━━
⏱️  Estimated reading time: ${Math.ceil(words.length / 200)} min`;
  }

  // Phase 5: Advanced Formatting & Cleaning Tools
  static removeHtmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  static removeXmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  static centerText(text: string, width: string): string {
    const lineWidth = parseInt(width, 10);
    if (isNaN(lineWidth) || lineWidth < 1 || lineWidth > 200) {
      return "Error: Width must be a number between 1 and 200.";
    }
    
    const lines = text.split('\n');
    return lines.map(line => {
      if (line.length >= lineWidth) return line;
      const padding = Math.floor((lineWidth - line.length) / 2);
      return ' '.repeat(padding) + line;
    }).join('\n');
  }

  static indentText(text: string, spaces: string): string {
    const indentSize = parseInt(spaces, 10);
    if (isNaN(indentSize) || indentSize < 0 || indentSize > 20) {
      return "Error: Indent size must be a number between 0 and 20.";
    }
    
    const indent = ' '.repeat(indentSize);
    const lines = text.split('\n');
    return lines.map(line => indent + line).join('\n');
  }

  static sortLines(text: string): string {
    const lines = text.split('\n');
    return lines.sort().join('\n');
  }

  static sortWords(text: string): string {
    const words = text.trim().split(/\s+/);
    return words.sort().join(' ');
  }

  static filterLines(text: string, pattern: string): string {
    if (!pattern || pattern.length === 0) {
      return "Error: Filter pattern is required.";
    }
    
    try {
      const regex = new RegExp(pattern, 'i');
      const lines = text.split('\n');
      const filteredLines = lines.filter(line => regex.test(line));
      
      if (filteredLines.length === 0) {
        return "No lines match the filter pattern.";
      }
      
      return filteredLines.join('\n');
    } catch (error) {
      return "Error: Invalid filter pattern.";
    }
  }

  // Phase 6: Text Generators
  static generateLoremIpsum(paragraphs: string): string {
    const paragraphCount = parseInt(paragraphs, 10);
    if (isNaN(paragraphCount) || paragraphCount < 1 || paragraphCount > 10) {
      return "Error: Paragraph count must be a number between 1 and 10.";
    }
    
    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];
    
    const result: string[] = [];
    
    for (let p = 0; p < paragraphCount; p++) {
      const sentences: string[] = [];
      const sentenceCount = Math.floor(Math.random() * 4) + 4; // 4-7 sentences
      
      for (let s = 0; s < sentenceCount; s++) {
        const words: string[] = [];
        const wordCount = Math.floor(Math.random() * 12) + 8; // 8-19 words
        
        for (let w = 0; w < wordCount; w++) {
          const randomWord = loremWords[Math.floor(Math.random() * loremWords.length)];
          words.push(w === 0 ? randomWord.charAt(0).toUpperCase() + randomWord.slice(1) : randomWord);
        }
        
        sentences.push(words.join(' ') + '.');
      }
      
      result.push(sentences.join(' '));
    }
    
    return result.join('\n\n');
  }

  static generateRandomWords(count: string): string {
    const wordCount = parseInt(count, 10);
    if (isNaN(wordCount) || wordCount < 1 || wordCount > 1000) {
      return "Error: Word count must be a number between 1 and 1000.";
    }
    
    const commonWords = [
      'apple', 'banana', 'orange', 'grape', 'cherry', 'lemon', 'strawberry', 'blueberry',
      'house', 'car', 'tree', 'flower', 'mountain', 'river', 'ocean', 'forest',
      'happy', 'sad', 'angry', 'excited', 'calm', 'nervous', 'proud', 'grateful',
      'run', 'walk', 'jump', 'dance', 'sing', 'laugh', 'cry', 'smile',
      'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black',
      'dog', 'cat', 'bird', 'fish', 'rabbit', 'horse', 'elephant', 'lion',
      'book', 'pen', 'paper', 'computer', 'phone', 'table', 'chair', 'window',
      'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'fire'
    ];
    
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const randomWord = commonWords[Math.floor(Math.random() * commonWords.length)];
      words.push(randomWord);
    }
    
    return words.join(' ');
  }

  static generateRandomLetters(count: string): string {
    const letterCount = parseInt(count, 10);
    if (isNaN(letterCount) || letterCount < 1 || letterCount > 10000) {
      return "Error: Letter count must be a number between 1 and 10000.";
    }
    
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    
    for (let i = 0; i < letterCount; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    return result;
  }

  static getAvailableTools(): ToolSignature[] {
    return [
      // Core Text Formatting Tools
      { name: 'toUppercase', description: 'Convert text to uppercase', renderMode: 'diff', params: ['text'] },
      { name: 'toLowercase', description: 'Convert text to lowercase', renderMode: 'diff', params: ['text'] },
      { name: 'capitalize', description: 'Capitalize the first letter of each word', renderMode: 'diff', params: ['text'] },
      { name: 'removeDuplicates', description: 'Remove duplicate lines', renderMode: 'diff', params: ['text'] },
      { name: 'countWords', description: 'Count words in text', renderMode: 'output', params: ['text'] },
      { name: 'countLines', description: 'Count lines in text', renderMode: 'output', params: ['text'] },
      { name: 'searchAndReplace', description: 'Search and replace a single phrase (up to 100 chars)', renderMode: 'diff', params: ['text', 'search', 'replace'] },
      { name: 'extractEmails', description: 'Extract all email addresses from text', renderMode: 'output', params: ['text'] },
      { name: 'formatPhoneNumbers', description: 'Format phone numbers to (XXX) XXX-XXXX format', renderMode: 'diff', params: ['text'] },
      { name: 'convertEuropeanNumbers', description: 'Convert European number format to American format', renderMode: 'diff', params: ['text'] },
      { name: 'splitBySentences', description: 'Split text into separate lines by sentences', renderMode: 'diff', params: ['text'] },
      { name: 'removeExtraSpaces', description: 'Remove extra spaces and tabs', renderMode: 'diff', params: ['text'] },
      { name: 'removeBlankLines', description: 'Remove empty lines', renderMode: 'diff', params: ['text'] },
      { name: 'addLineNumbers', description: 'Add line numbers to each line', renderMode: 'diff', params: ['text'] },
      { name: 'addPrefix', description: 'Add prefix to each line', renderMode: 'diff', params: ['text', 'prefix'] },
      { name: 'addSuffix', description: 'Add suffix to each line', renderMode: 'diff', params: ['text', 'suffix'] },
      { name: 'reverseText', description: 'Reverse entire text', renderMode: 'diff', params: ['text'] },
      { name: 'repeatText', description: 'Repeat text multiple times (1-100)', renderMode: 'output', params: ['text', 'times'] },

      // CSV Tools
      { name: 'csvToJson', description: 'Convert CSV to JSON', renderMode: 'output', params: ['text'] },
      { name: 'removeCsvColumns', description: 'Remove specified columns from CSV data', renderMode: 'diff', params: ['text', 'columnsToRemove'] },
      
      // Text Manipulation & Shuffling Tools
      { name: 'shuffleWords', description: 'Randomly shuffle words', renderMode: 'diff', params: ['text'] },
      { name: 'shuffleLetters', description: 'Randomly shuffle letters', renderMode: 'diff', params: ['text'] },
      { name: 'shuffleParagraphs', description: 'Randomly shuffle paragraphs', renderMode: 'diff', params: ['text'] },
      { name: 'invertCase', description: 'Invert uppercase/lowercase', renderMode: 'diff', params: ['text'] },
      { name: 'randomizeCase', description: 'Randomly capitalize letters', renderMode: 'diff', params: ['text'] },
      { name: 'joinWords', description: 'Join words with custom separator', renderMode: 'diff', params: ['text', 'separator'] },
      
      // Text Splitting & Extraction Tools
      { name: 'splitWords', description: 'Split text into individual words', renderMode: 'diff', params: ['text'] },
      { name: 'splitParagraphs', description: 'Split text into numbered paragraphs', renderMode: 'diff', params: ['text'] },
      { name: 'extractUrls', description: 'Extract URLs from text', renderMode: 'output', params: ['text'] },
      { name: 'extractNumbers', description: 'Extract numbers from text', renderMode: 'output', params: ['text'] },
      { name: 'extractPhoneNumbers', description: 'Extract phone numbers from text', renderMode: 'output', params: ['text'] },
      { name: 'extractRegexMatches', description: 'Extract text matching regex pattern', renderMode: 'output', params: ['text', 'pattern'] },
      
      // Text Statistics & Analysis Tools
      { name: 'countCharacters', description: 'Count characters in text', renderMode: 'output', params: ['text'] },
      { name: 'countSentences', description: 'Count sentences in text', renderMode: 'output', params: ['text'] },
      { name: 'countParagraphs', description: 'Count paragraphs in text', renderMode: 'output', params: ['text'] },
      { name: 'getTextStatistics', description: 'Get comprehensive text statistics', renderMode: 'output', params: ['text'] },
      
      // Advanced Formatting & Cleaning Tools
      { name: 'removeHtmlTags', description: 'Remove HTML tags from text', renderMode: 'diff', params: ['text'] },
      { name: 'removeXmlTags', description: 'Remove XML tags from text', renderMode: 'diff', params: ['text'] },
      { name: 'centerText', description: 'Center text within specified width (1-200)', renderMode: 'diff', params: ['text', 'width'] },
      { name: 'indentText', description: 'Indent text with spaces (0-20)', renderMode: 'diff', params: ['text', 'spaces'] },
      { name: 'sortLines', description: 'Sort lines alphabetically', renderMode: 'diff', params: ['text'] },
      { name: 'sortWords', description: 'Sort words alphabetically', renderMode: 'diff', params: ['text'] },
      { name: 'filterLines', description: 'Filter lines by regex pattern', renderMode: 'diff', params: ['text', 'pattern'] },
      
      // Text Generators
      { name: 'generateLoremIpsum', description: 'Generate Lorem Ipsum text (1-10 paragraphs)', renderMode: 'output', params: ['paragraphs'] },
      { name: 'generateRandomWords', description: 'Generate random words (1-1000)', renderMode: 'output', params: ['count'] },
      { name: 'generateRandomLetters', description: 'Generate random letters (1-10000)', renderMode: 'output', params: ['count'] },
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