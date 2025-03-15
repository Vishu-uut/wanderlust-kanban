"use client";
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/app/components/ui/button';
import { KanbanTask as KanbanTaskType } from '../types/kanban';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKanban } from '../context/KanbanContext';
import axios from 'axios';

interface KanbanTaskProps {
  task: KanbanTaskType;
  columnId: string;
  columnColor: string;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
}

const KanbanTask: React.FC<KanbanTaskProps> = ({ 
  task, 
  columnId, 
  columnColor, 
  onDragStart 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title || '');
  const { setBoard } = useKanban();

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put("/api/todos/edit", {
        id: task.id,
        title: editedTitle,
      });

      const updatedTask = response.data;
      console.log("read form here");
      console.log(updatedTask);

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

      setIsEditing(false);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(task.title || '');
    setIsEditing(false);
  };

  const handleDeleteTask = async () => {
    try {
      await axios.delete("/api/todos/delete", {
        data: { id: task.id },
      });

      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col) =>
          col.id === columnId ? { ...col, tasks: col.tasks.filter(t => t.id !== task.id) } : col
        ),
      }));
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <Card
      className={`kanban-task animate-scale-in`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, columnId)}
      data-task-id={task.id}
      style={{ 
        borderLeft: `3px solid ${columnColor}`,
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="mb-2"
              autoFocus
            />
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <h3 className="font-medium text-sm text-left cursor-pointer hover:text-primary transition-colors">
                  {task.title}
                </h3>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{task.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="p-4">
                    {/* Additional task details can be added here */}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {!isEditing && (
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
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start text-destructive hover:text-destructive"
                  onClick={handleDeleteTask}
                >
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {isEditing && (
        <>
          <div className="flex justify-end space-x-2 mt-3">
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default KanbanTask;