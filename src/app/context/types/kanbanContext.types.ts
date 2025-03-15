import { KanbanBoard, KanbanTask } from "../../types/kanban";

export interface KanbanContextType {
  board: KanbanBoard;
  setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>;
  addColumn: (title: string) => void;
  updateColumn: (
    columnId: string,
    title: string,
    color: string,
    darkColor: string
  ) => void;
  deleteColumn: (columnId: string) => void;
  addTask: (columnId: string, task: Partial<KanbanTask>) => void;
  updateTask: (
    taskId: string,
    columnId: string,
    updates: Partial<KanbanTask>
  ) => void;
  deleteTask: (taskId: string, columnId: string) => void;
  moveTask: (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string
  ) => void;
  moveColumn: (sourceIndex: number, destinationIndex: number) => void;
  draggingItem: { id: string; type: "task" | "column" } | null;
  setDraggingItem: React.Dispatch<
    React.SetStateAction<{ id: string; type: "task" | "column" } | null>
  >;
}
