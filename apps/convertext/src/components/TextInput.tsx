import React from 'react';
import { Button } from '@draft-gen/ui';
import { Textarea } from '@draft-gen/ui';
import { Upload } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  addFromResultButton?: React.ReactNode;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, addFromResultButton }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onChange(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="text" className="block text-sm font-medium text-foreground">
        Your content:
      </label>
      <div className="flex space-x-4">
        <Textarea
          id="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-h-[120px]"
          placeholder="Paste your text here or upload a file..."
        />
        <div className="flex flex-col justify-center">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.md,.csv"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </label>
          </Button>
          {addFromResultButton}
        </div>
      </div>
    </div>
  );
};

export default TextInput;
