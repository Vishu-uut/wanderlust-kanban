import { useState } from "react";
import { KanbanBoard, KanbanColumn } from "../types/kanban";
import { toast } from "sonner";

export const useKanbanColumns = (
  board: KanbanBoard,
  setBoard: React.Dispatch<React.SetStateAction<KanbanBoard>>
) => {
  const addColumn = (title: string) => {
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title,
      color: "#f2f2f2",
      darkColor: "#808080",
      tasks: [],
    };

    setBoard((prev) => ({
      ...prev,
      columns: [...prev.columns, newColumn],
    }));

    toast.success(`Column "${title}" added`);
  };

  const updateColumn = (
    columnId: string,
    title: string,
    color: string,
    darkColor: string
  ) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            title,
            color,
            darkColor,
          };
        }
        return column;
      }),
    }));

    toast.success(`Column "${title}" updated`);
  };

  const deleteColumn = (columnId: string) => {
    const columnToDelete = board.columns.find((col) => col.id === columnId);
    if (!columnToDelete) return;

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((column) => column.id !== columnId),
    }));

    toast.success(`Column "${columnToDelete.title}" deleted`);
  };

  const moveColumn = (sourceIndex: number, destinationIndex: number) => {
    const newColumns = [...board.columns];
    const [removed] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(destinationIndex, 0, removed);

    setBoard({
      ...board,
      columns: newColumns,
    });
  };

  return {
    addColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
  };
};
