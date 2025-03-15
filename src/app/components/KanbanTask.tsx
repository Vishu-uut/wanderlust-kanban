"use client";
import React, { useState, useCallback, memo } from 'react';
import { Card } from '../components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '@/app/components/ui/button';
import { KanbanTask as KanbanTaskType } from '../types/kanban';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { useKanban } from '../context/KanbanContext';
import axios from 'axios';

interface KanbanTaskProps {
  task: KanbanTaskType;
  columnId: string;
  columnColor: string;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
}

// Memoized Components
const TaskDialog = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>
      <h3 className="font-medium text-sm text-left cursor-pointer hover:text-primary transition-colors">
        {title}
      </h3>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh]">
        <div className="p-4">{children}</div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
));

const TaskPopover = memo(({ onEdit, onDelete }: { 
  onEdit: () => void; 
  onDelete: () => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-48" align="end">
      <div className="flex flex-col space-y-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </PopoverContent>
  </Popover>
));

const EditActions = memo(({ onCancel, onSave }: {
  onCancel: () => void;
  onSave: () => void;
}) => (
  <div className="flex justify-end space-x-2 mt-3">
    <Button size="sm" variant="ghost" onClick={onCancel}>
      Cancel
    </Button>
    <Button size="sm" onClick={onSave}>
      Save
    </Button>
  </div>
));

const KanbanTask: React.FC<KanbanTaskProps> = memo(({ 
  task, 
  columnId, 
  columnColor, 
  onDragStart 
}) => {
  // State management
  const [state, setState] = useState({
    isEditing: false,
    editedTitle: task.title || '',
  });

  const { setBoard } = useKanban();

  // Memoized handlers
  const handleSaveEdit = useCallback(async () => {
    if (!state.editedTitle.trim()) return;

    try {
      const response = await axios.put("/api/todos/edit", {
        id: task.id,
        title: state.editedTitle,
      });

      const updatedTask = response.data;

      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === task.id ? { ...t, title: updatedTask.todo } : t
                ),
              }
            : col
        ),
      }));

      setState(prev => ({ ...prev, isEditing: false }));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [state.editedTitle, task.id, columnId, setBoard]);

  const handleCancelEdit = useCallback(() => {
    setState(prev => ({
      isEditing: false,
      editedTitle: task.title || ''
    }));
  }, [task.title]);

  const handleDeleteTask = useCallback(async () => {
    try {
      await axios.delete("/api/todos/delete", {
        data: { id: task.id },
      });

      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col) =>
          col.id === columnId 
            ? { ...col, tasks: col.tasks.filter(t => t.id !== task.id) } 
            : col
        ),
      }));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [task.id, columnId, setBoard]);

  const handleStartEdit = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: true }));
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, editedTitle: e.target.value }));
  }, []);

  return (
    <Card
      className="kanban-task animate-scale-in"
      draggable
      onDragStart={(e) => onDragStart(e, task.id, columnId)}
      data-task-id={task.id}
      style={{ borderLeft: `3px solid ${columnColor}` }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {state.isEditing ? (
            <Input
              value={state.editedTitle}
              onChange={handleTitleChange}
              className="mb-2"
              autoFocus
            />
          ) : (
            <TaskDialog title={task.title}>
              <div>{/* Additional task details can be added here */}</div>
            </TaskDialog>
          )}
        </div>
        
        {!state.isEditing && (
          <TaskPopover 
            onEdit={handleStartEdit}
            onDelete={handleDeleteTask}
          />
        )}
      </div>
      
      {state.isEditing && (
        <EditActions 
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
        />
      )}
    </Card>
  );
});

KanbanTask.displayName = 'KanbanTask';

export default KanbanTask;