"use client";
import React, { useEffect, useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import KanbanColumn from './KanbanColumn';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Menu, LogOut, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { KanbanBoard, KanbanColumn as KanbanColumnType, KanbanTask } from '../types/kanban';
import Shimmer from './Shimmer';
import useIsMobile from '../hooks/use-mobile';
import { v4 as uuidv4 } from 'uuid';

const KanbanBoardComponent: React.FC = () => {
  const { 
    board, 
    setBoard,
    addColumn, 
    moveTask, 
    draggingItem, 
    setDraggingItem 
  } = useKanban();
  
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        const response = await fetch("/api/todos/add", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            todo: newTaskTitle,
            completed: false,
            userId: localStorage.getItem("userId"),
          }),
        });

        const data = await response.json();

        const newTask: KanbanTask = {
          id: data.id || uuidv4(),
          title: newTaskTitle,
        };

        setBoard((prevBoard) => ({
          ...prevBoard,
          columns: prevBoard.columns.map((col, index) =>
            index === activeColumnIndex
              ? { ...col, tasks: [...col.tasks, newTask] }
              : col
          ),
        }));

        setNewTaskTitle('');
        setIsAddingTask(false);
      } catch (err) {
        console.error('Failed to add task:', err);
      }
    }
  };

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch("/api/todos");
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Failed to load todos");

        const updatedColumns: KanbanColumnType[] = [
          { id: '1', title: 'To-Do', color: '#F0E57F', darkColor: '#fbc02d', tasks: [] as KanbanTask[] },
          { id: '2', title: 'In Progress', color: '#88C6E2', darkColor: '#0288d1', tasks: [] as KanbanTask[] },
          { id: '3', title: 'Completed', color: '#8DDD90', darkColor: '#388e3c', tasks: [] as KanbanTask[] },
        ];
        data.forEach((todo: any) => {
          const randomColumnIndex = Math.floor(Math.random() * 3);
          const newTask: KanbanTask = {
            id: todo.id.toString(),
            title: todo.todo,
          };
          updatedColumns[randomColumnIndex].tasks.push(newTask);
        });

        setBoard({ columns: updatedColumns });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [setBoard]);

  // ... (continuing in Part 2)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleDragStart = (e: React.DragEvent, taskId: string, columnId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceColumnId', columnId);
    setDragSourceColumnId(columnId);
    setDraggingItem({ id: taskId, type: 'task' });
    
    setTimeout(() => {
      const element = document.querySelector(`[data-task-id="${taskId}"]`);
      if (element) {
        element.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, destinationColumnId: string) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
    
    if (taskId && sourceColumnId && sourceColumnId !== destinationColumnId) {
      moveTask(taskId, sourceColumnId, destinationColumnId);
    }
    
    setDraggingItem(null);
    setDragSourceColumnId(null);
    
    document.querySelectorAll('.kanban-task').forEach(task => {
      task.classList.remove('dragging');
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggingItem(null);
    setDragSourceColumnId(null);
    
    document.querySelectorAll('.kanban-task').forEach(task => {
      task.classList.remove('dragging');
    });
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle);
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <>
      <header className="flex justify-between items-center mb-8 px-4">
        {isMobile ? (
          <>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className="p-2"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <p className="text-2xl font-bold">{board.columns[activeColumnIndex]?.title}</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <p className="text-2xl font-bold">Welcome, {username}</p>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsAddingColumn(true)}
                className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('username');
                  router.push('/login');
                }}
                className="bg-gray-500 hover:bg-red-600 hover:scale-105 transition-all duration-200 text-white"
              >
                Logout
              </Button>
            </div>
          </>
        )}
      </header>

      {/* Column Selection Menu for Mobile */}
      {isMobile && isColumnMenuOpen && (
        <div className="fixed inset-y-0 left-0 z-40">
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-lg slide-in">
            <div className="flex flex-col h-full">
              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Welcome, {username}</h2>
                  <Button
                    onClick={() => setIsColumnMenuOpen(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {board.columns.map((column, index) => (
                    <Button
                      key={column.id}
                      variant="ghost"
                      className={`w-full text-left justify-start p-3 ${
                        activeColumnIndex === index 
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setActiveColumnIndex(index);
                        setIsColumnMenuOpen(false);
                      }}
                    >
                      {column.title}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-4 border-t">
                <div className="space-y-2">
                  <Button
                    className="w-full flex items-center justify-start px-3 py-2 hover:bg-gray-100"
                    variant="ghost"
                    onClick={() => {
                      setIsColumnMenuOpen(false);
                      setIsAddingColumn(true);
                    }}
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Add Column
                  </Button>
                  <Button
                    className="w-full flex items-center justify-start px-3 py-2 hover:bg-gray-100 text-red-600 hover:text-red-700"
                    variant="ghost"
                    onClick={() => {
                      localStorage.removeItem('username');
                      router.push('/login');
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex ${isMobile ? 'flex-col items-center w-full' : 'flex-row w-full'} h-full justify-center`}>
        {loading ? (
          <div className="flex space-x-4 pb-4 justify-evenly w-full">
            <Shimmer />
            <Shimmer />
            <Shimmer />
          </div>
        ) : (
          <div 
            className={`
              flex 
              ${isMobile ? 'flex-col w-full px-4 space-y-4' : 'flex-row w-full px-8'} 
              pb-4 
              ${isMobile ? 'items-center' : 'justify-evenly'}
              overflow-x-auto
            `}
            onDragEnd={handleDragEnd}
          >
            {isMobile ? (
              <div className="w-full max-w-sm">
                <KanbanColumn
                  column={board.columns[activeColumnIndex]}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                />
                <Button
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => setIsAddingTask(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Card
                </Button>
              </div>
            ) : (
              board.columns.map((column) => (
                <div 
                  key={column.id} 
                  className="w-[350px] flex-shrink-0"
                >
                  <KanbanColumn
                    column={column}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Column Dialog */}
        <Dialog open={isAddingColumn} onOpenChange={setIsAddingColumn}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Column</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="column-title">Title</Label>
                <Input
                  id="column-title"
                  placeholder="Enter column title"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingColumn(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddColumn}>Add Column</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Task Dialog */}
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Task to {board.columns[activeColumnIndex]?.title}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Task Title</Label>
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
              <Button variant="outline" onClick={() => {
                setIsAddingTask(false);
                setNewTaskTitle('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default KanbanBoardComponent;