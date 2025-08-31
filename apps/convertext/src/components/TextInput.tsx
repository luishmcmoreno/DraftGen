import React from 'react';

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
      <label htmlFor="text" className="block text-sm font-medium text-slate-700">
        Your content:
      </label>
      <div className="flex space-x-4">
        <textarea
          id="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-h-[120px] block w-full rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-3 py-2"
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
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer text-center"
          >
            Upload File
          </label>
          {addFromResultButton}
        </div>
      </div>
    </div>
  );
};

export default TextInput; 