"use client";
import React, { useState, useRef, useCallback, memo } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useKanban } from '../context/KanbanContext';
import KanbanTask from './KanbanTask';
import { Button } from '@/app/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/app/components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { KanbanColumn as KanbanColumnType, KanbanTask as KanbanTaskType } from '../types/kanban';
import { cn } from '@/lib/utils';

// Types
interface KanbanColumnProps {
  column: KanbanColumnType;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragEnter: (e: React.DragEvent, columnId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Memoized Components
const MemoizedKanbanTask = memo(KanbanTask);

const DialogWrapper = memo(({ isOpen, onClose, children }: DialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[500px]">
      {children}
    </DialogContent>
  </Dialog>
));

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columnTitle: string;
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  onAdd: () => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = memo(({ 
  isOpen, 
  onClose, 
  columnTitle, 
  newTaskTitle, 
  setNewTaskTitle, 
  onAdd 
}) => (
  <DialogWrapper isOpen={isOpen} onClose={onClose}>
    <DialogHeader>
      <DialogTitle>Add Task to {columnTitle}</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          placeholder="Enter task title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          autoFocus
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onAdd}>Add Task</Button>
    </DialogFooter>
  </DialogWrapper>
));

interface EditColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editedColumnTitle: string;
  setEditedColumnTitle: (title: string) => void;
  editedColumnColor: string;
  setEditedColumnColor: (color: string) => void;
  editedDarkColor: string;
  setEditedDarkColor: (color: string) => void;
  onSave: () => void;
}

const EditColumnDialog: React.FC<EditColumnDialogProps> = memo(({ 
  isOpen, 
  onClose, 
  editedColumnTitle, 
  setEditedColumnTitle,
  editedColumnColor,
  setEditedColumnColor,
  editedDarkColor,
  setEditedDarkColor,
  onSave
}) => (
  <DialogWrapper isOpen={isOpen} onClose={onClose}>
    <DialogHeader>
      <DialogTitle>Edit Column</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Column Title Input */}
      <div className="grid gap-2">
        <Label htmlFor="column-title">Title</Label>
        <Input
          id="column-title"
          placeholder="Enter column title"
          value={editedColumnTitle}
          onChange={(e) => setEditedColumnTitle(e.target.value)}
          autoFocus
        />
      </div>
      
      {/* Color Inputs */}
      {['Background Color', 'Accent Color'].map((label, index) => (
        <div key={label} className="grid gap-2">
          <Label htmlFor={`column-color-${index}`}>{label}</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`column-color-${index}`}
              type="color"
              value={index === 0 ? editedColumnColor : editedDarkColor}
              onChange={(e) => 
                index === 0 
                  ? setEditedColumnColor(e.target.value)
                  : setEditedDarkColor(e.target.value)
              }
              className="w-16 h-10 p-1"
            />
            <span className="text-sm text-muted-foreground">
              {index === 0 ? editedColumnColor : editedDarkColor}
            </span>
          </div>
        </div>
      ))}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSave}>Save Changes</Button>
    </DialogFooter>
  </DialogWrapper>
));

const KanbanColumn: React.FC<KanbanColumnProps> = memo(({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
}) => {
  const { setBoard } = useKanban();
  const columnRef = useRef<HTMLDivElement>(null);
  
  // State management with useState
  const [state, setState] = useState({
    isAddingTask: false,
    newTaskTitle: '',
    isEditingColumn: false,
    editedColumnTitle: column.title,
    editedColumnColor: column.color,
    editedDarkColor: column.darkColor,
    isDraggingOver: false
  });

  // Memoized handlers
  const handleAddTask = useCallback(async () => {
    if (!state.newTaskTitle.trim()) return;

    try {
      const response = await axios.post("/api/todos/add", {
        todo: state.newTaskTitle,
        completed: false,
        userId: localStorage.getItem("userId"),
      });

      const newTask: KanbanTaskType = {
        id: uuidv4(),
        title: response.data.todo,
      };

      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col) =>
          col.id === column.id 
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col
        ),
      }));

      setState(prev => ({
        ...prev,
        newTaskTitle: '',
        isAddingTask: false
      }));
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  }, [state.newTaskTitle, column.id, setBoard]);

  const handleUpdateColumn = useCallback(() => {
    if (!state.editedColumnTitle.trim()) return;

    setBoard((prevBoard) => ({
      ...prevBoard,
      columns: prevBoard.columns.map((col) =>
        col.id === column.id
          ? {
              ...col,
              title: state.editedColumnTitle,
              color: state.editedColumnColor,
              darkColor: state.editedDarkColor
            }
          : col
      ),
    }));

    setState(prev => ({ ...prev, isEditingColumn: false }));
  }, [state.editedColumnTitle, state.editedColumnColor, state.editedDarkColor, column.id, setBoard]);

  const handleDeleteColumn = useCallback(() => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      columns: prevBoard.columns.filter((col) => col.id !== column.id),
    }));
  }, [column.id, setBoard]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    onDragOver(e);
    setState(prev => ({ ...prev, isDraggingOver: true }));
  }, [onDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    onDragLeave(e);
    setState(prev => ({ ...prev, isDraggingOver: false }));
  }, [onDragLeave]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop(e, column.id);
    setState(prev => ({ ...prev, isDraggingOver: false }));
  }, [onDrop, column.id]);

  return (
    <div 
      ref={columnRef}
      className={cn(
        "kanban-column animate-fade-in w-full rounded-lg p-4",
        state.isDraggingOver && "dragging-over"
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={(e) => onDragEnter(e, column.id)}
      onDragLeave={handleDragLeave}
      style={{ 
        backgroundColor: column.color,
        minHeight: 'min-content'
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: column.darkColor }}
          />
          <h3 className="font-medium flex items-center">
            {column.title}
            <span className="ml-2 text-sm text-muted-foreground">
              {column.tasks.length}
            </span>
          </h3>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {[
            { icon: Plus, onClick: () => setState(prev => ({ ...prev, isAddingTask: true })) },
            { icon: Pencil, onClick: () => setState(prev => ({ ...prev, isEditingColumn: true })) },
            { icon: Trash2, onClick: handleDeleteColumn, className: "hover:text-red-600" }
          ].map((button, index) => (
            <Button 
              key={index}
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", button.className)}
              onClick={button.onClick}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2 min-h-[50px]">
        {column.tasks.map(task => (
          <MemoizedKanbanTask
            key={task.id}
            task={task}
            columnId={column.id}
            columnColor={column.darkColor}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      {/* Dialogs */}
      <AddTaskDialog
        isOpen={state.isAddingTask}
        onClose={() => setState(prev => ({ ...prev, isAddingTask: false }))}
        columnTitle={column.title}
        newTaskTitle={state.newTaskTitle}
        setNewTaskTitle={(title) => setState(prev => ({ ...prev, newTaskTitle: title }))}
        onAdd={handleAddTask}
      />

      <EditColumnDialog
        isOpen={state.isEditingColumn}
        onClose={() => setState(prev => ({ ...prev, isEditingColumn: false }))}
        editedColumnTitle={state.editedColumnTitle}
        setEditedColumnTitle={(title) => setState(prev => ({ ...prev, editedColumnTitle: title }))}
        editedColumnColor={state.editedColumnColor}
        setEditedColumnColor={(color) => setState(prev => ({ ...prev, editedColumnColor: color }))}
        editedDarkColor={state.editedDarkColor}
        setEditedDarkColor={(color) => setState(prev => ({ ...prev, editedDarkColor: color }))}
        onSave={handleUpdateColumn}
      />
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn;