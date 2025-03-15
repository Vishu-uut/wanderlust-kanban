"use client";
import React, { createContext, useContext, useState } from 'react';
import { KanbanBoard } from '../types/kanban';
import { KanbanContextType } from './types/kanbanContext.types';
import { useKanbanColumns } from '../hooks/useKanbanColumns';
import { useKanbanTasks } from '../hooks/useKanbanTasks';

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [board, setBoard] = useState<KanbanBoard>({ columns: [] });
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'task' | 'column' } | null>(null);

  const { addColumn, updateColumn, deleteColumn, moveColumn } = useKanbanColumns(board, setBoard);
  const { addTask, updateTask, deleteTask, moveTask } = useKanbanTasks(board, setBoard);

  return (
    <KanbanContext.Provider
      value={{
        board,
        setBoard,
        addColumn,
        updateColumn,
        deleteColumn,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        moveColumn,
        draggingItem,
        setDraggingItem,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
};