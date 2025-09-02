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
        <label htmlFor="task-description" className="block text-sm font-medium text-foreground">
          What do you want to do with the content?
        </label>
        <input
          type="text"
          id="task-description"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="block w-full rounded-lg border-input bg-background shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-3 py-2"
          placeholder="e.g. Capitalize all items in column department"
        />
      </div>
      <button
        onClick={onExecute}
        className="px-3 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
      >
        Execute
      </button>
    </div>
  );
};

export default TaskInput;
