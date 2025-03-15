import { KanbanBoard, KanbanTask } from "../types/kanban";
import { toast } from "sonner";

export const useKanbanTasks = (
  board: KanbanBoard,
  setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>
) => {
  const addTask = (columnId: string, taskData: Partial<KanbanTask>) => {
    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: taskData.title || "New Task",
    };

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            tasks: [...column.tasks, newTask],
          };
        }
        return column;
      }),
    }));

    toast.success(`Task "${newTask.title}" added`);
  };

  const updateTask = (
    taskId: string,
    columnId: string,
    updates: Partial<KanbanTask>
  ) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            tasks: column.tasks.map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  ...updates,
                };
              }
              return task;
            }),
          };
        }
        return column;
      }),
    }));

    toast.success(`Task updated`);
  };

  const deleteTask = (taskId: string, columnId: string) => {
    const columnIndex = board.columns.findIndex((col) => col.id === columnId);
    if (columnIndex === -1) return;

    const taskToDelete = board.columns[columnIndex].tasks.find(
      (task) => task.id === taskId
    );
    if (!taskToDelete) return;

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            tasks: column.tasks.filter((task) => task.id !== taskId),
          };
        }
        return column;
      }),
    }));

    toast.success(`Task "${taskToDelete.title}" deleted`);
  };

  const moveTask = (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string
  ) => {
    const sourceColumn = board.columns.find((col) => col.id === sourceColumnId);
    if (!sourceColumn) return;

    const task = sourceColumn.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Remove from source column
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === sourceColumnId) {
          return {
            ...column,
            tasks: column.tasks.filter((t) => t.id !== taskId),
          };
        }
        if (column.id === destinationColumnId) {
          return {
            ...column,
            tasks: [...column.tasks, task],
          };
        }
        return column;
      }),
    }));
  };

  return {
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  };
};
