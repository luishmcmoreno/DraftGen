import React from 'react';

interface TaskInputProps {
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  onExecute: () => void;
}

const TaskInput: React.FC<TaskInputProps> = ({
  taskDescription,
  setTaskDescription,
  onExecute,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="task-description"
          className="block text-sm font-medium text-slate-700"
        >
          What do you want to do with the content?
        </label>
        <input
          type="text"
          id="task-description"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="block w-full rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm px-3 py-2"
          placeholder="e.g. Capitalize all items in column department"
        />
      </div>
      <button
        onClick={onExecute}
        className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
      >
        Execute
      </button>
    </div>
  );
};

export default TaskInput; 