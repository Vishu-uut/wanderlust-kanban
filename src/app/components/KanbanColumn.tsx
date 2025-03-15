"use client";
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useKanban } from '../context/KanbanContext';
import KanbanTask from './KanbanTask';
import { Button } from '@/app/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/app/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanColumn as KanbanColumnType, KanbanTask as KanbanTaskType } from '../types/kanban';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragEnter: (e: React.DragEvent, columnId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;

}


const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
}) => {
  const { setBoard } = useKanban();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [editedColumnTitle, setEditedColumnTitle] = useState(column.title);
  const [editedColumnColor, setEditedColumnColor] = useState(column.color);
  const [editedDarkColor, setEditedDarkColor] = useState(column.darkColor);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        const response = await axios.post("/api/todos/add", {
          todo: newTaskTitle,
          completed: false,
          userId: localStorage.getItem("userId"),
        });

        const data = response.data;

        const newTask: KanbanTaskType = {
          id: uuidv4(), 
          title: data.todo,
        };

        const updatedColumns = column.tasks.concat(newTask);

        setBoard((prevBoard) => ({
          ...prevBoard,
          columns: prevBoard.columns.map((col) =>
            col.id === column.id ? { ...col, tasks: updatedColumns } : col
          ),
        }));

        setNewTaskTitle('');
        
        setIsAddingTask(false);
      } catch (err: any) {
        console.error(err.message);
      }
    }
  };

  const handleUpdateColumn = () => {
    if (editedColumnTitle.trim()) {
      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col) =>
          col.id === column.id
            ? { ...col, title: editedColumnTitle, color: editedColumnColor, darkColor: editedDarkColor }
            : col
        ),
      }));
      setIsEditingColumn(false);
    }
  };

  const handleDeleteColumn = () => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      columns: prevBoard.columns.filter((col) => col.id !== column.id),
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    onDragOver(e);
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    onDragLeave(e);
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, column.id);
    setIsDraggingOver(false);
  };

  return (
    <div 
    ref={columnRef}
    className={cn(
      "kanban-column animate-fade-in w-full", // Added w-full
      "rounded-lg p-4",
      isDraggingOver && "dragging-over"
    )}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    onDragEnter={(e) => onDragEnter(e, column.id)}
    onDragLeave={handleDragLeave}
    style={{ 
      backgroundColor: column.color,
      minHeight: 'min-content' // Remove fixed height
    }}
  >
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
      
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => setIsAddingTask(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
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
                onClick={() => setIsEditingColumn(true)}
              >
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start text-destructive hover:text-destructive"
                onClick={handleDeleteColumn}
              >
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
    
    <div className="space-y-2 min-h-[50px]"> {/* Changed from ScrollArea to div with spacing */}
      {column.tasks.map(task => (
        <KanbanTask
          key={task.id}
          task={task}
          columnId={column.id}
          columnColor={column.darkColor}
          onDragStart={onDragStart}
        />
      ))}
    </div>

    {/* Add Task Dialog */}
    <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Task to {column.title}</DialogTitle>
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
          <Button variant="outline" onClick={() => setIsAddingTask(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddTask}>Add Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
      {/* Edit Column Dialog */}
      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
            
            <div className="grid gap-2">
              <Label htmlFor="column-light-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="column-light-color"
                  type="color"
                  value={editedColumnColor}
                  onChange={(e) => setEditedColumnColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">
                  {editedColumnColor}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="column-dark-color">Accent Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="column-dark-color"
                  type="color"
                  value={editedDarkColor}
                  onChange={(e) => setEditedDarkColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">
                  {editedDarkColor}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingColumn(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateColumn}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanColumn;