"use client";
import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
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

// Types
interface AddColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (title: string) => void;
  onAdd: () => void;
}

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (title: string) => void;
  onAdd: () => void;
  columnTitle: string;
}

interface State {
  isAddingColumn: boolean;
  isAddingTask: boolean;
  newColumnTitle: string;
  newTaskTitle: string;
  dragSourceColumnId: string | null;
  loading: boolean;
  error: string;
  isMenuOpen: boolean;
  activeColumnIndex: number;
  isColumnMenuOpen: boolean;
  username: string;
}

// Memoized Column Component
const MemoizedKanbanColumn = memo(KanbanColumn);

// Memoized Dialog Components
const AddColumnDialog = memo(({ 
  isOpen, 
  onClose, 
  title, 
  setTitle, 
  onAdd 
}: AddColumnDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onAdd}>Add Column</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
));

const AddTaskDialog = memo(({ 
  isOpen, 
  onClose, 
  title, 
  setTitle, 
  onAdd,
  columnTitle 
}: AddTaskDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add Task to {columnTitle}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="task-title">Task Title</Label>
          <Input
            id="task-title"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onAdd}>Add Task</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
));

// Mobile Menu Component
interface MobileMenuProps {
  username: string;
  columns: KanbanColumnType[];
  activeIndex: number;
  onColumnSelect: (index: number) => void;
  onClose: () => void;
  onAddColumn: () => void;
  onLogout: () => void;
}

const MobileMenu = memo(({ 
  username, 
  columns, 
  activeIndex, 
  onColumnSelect, 
  onClose, 
  onAddColumn, 
  onLogout 
}: MobileMenuProps) => (
  <div className="fixed inset-y-0 left-0 z-40">
    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-lg slide-in">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Welcome, {username}</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {columns.map((column, index) => (
              <Button
                key={column.id}
                variant="ghost"
                className={`w-full text-left justify-start p-3 ${
                  activeIndex === index 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onColumnSelect(index)}
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
              onClick={onAddColumn}
            >
              <Plus className="h-5 w-5 mr-3" />
              Add Column
            </Button>
            <Button
              className="w-full flex items-center justify-start px-3 py-2 hover:bg-gray-100 text-red-600 hover:text-red-700"
              variant="ghost"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
));

const KanbanBoardComponent: React.FC = () => {
  const { 
    board, 
    setBoard,
    addColumn, 
    moveTask, 
    draggingItem, 
    setDraggingItem 
  } = useKanban();
  
  const [state, setState] = useState<State>({
    isAddingColumn: false,
    isAddingTask: false,
    newColumnTitle: '',
    newTaskTitle: '',
    dragSourceColumnId: null,
    loading: true,
    error: '',
    isMenuOpen: false,
    activeColumnIndex: 0,
    isColumnMenuOpen: false,
    username: ''
  });

  const isMobile = useIsMobile();
  const router = useRouter();

  // Memoized handlers
  const handleAddTask = useCallback(async () => {
    if (!state.newTaskTitle.trim()) return;

    try {
      const response = await fetch("/api/todos/add", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todo: state.newTaskTitle,
          completed: false,
          userId: localStorage.getItem("userId"),
        }),
      });

      const data = await response.json();
      const newTask: KanbanTask = {
        id: data.id || uuidv4(),
        title: state.newTaskTitle,
      };

      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col, index) =>
          index === state.activeColumnIndex
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
  }, [state.newTaskTitle, state.activeColumnIndex, setBoard]);

  const handleAddColumn = useCallback(() => {
    if (state.newColumnTitle.trim()) {
      addColumn(state.newColumnTitle);
      setState(prev => ({
        ...prev,
        newColumnTitle: '',
        isAddingColumn: false
      }));
    }
  }, [state.newColumnTitle, addColumn]);

  // Memoized drag handlers
  const dragHandlers = useMemo(() => ({
    handleDragStart: (e: React.DragEvent, taskId: string, columnId: string) => {
      e.dataTransfer.setData('taskId', taskId);
      e.dataTransfer.setData('sourceColumnId', columnId);
      setState(prev => ({ ...prev, dragSourceColumnId: columnId }));
      setDraggingItem({ id: taskId, type: 'task' });
    },
    handleDragOver: (e: React.DragEvent) => {
      e.preventDefault();
    },
    handleDrop: (e: React.DragEvent, destinationColumnId: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
      
      if (taskId && sourceColumnId && sourceColumnId !== destinationColumnId) {
        moveTask(taskId, sourceColumnId, destinationColumnId);
      }
      
      setDraggingItem(null);
      setState(prev => ({ ...prev, dragSourceColumnId: null }));
    },
    handleDragEnd: () => {
      setDraggingItem(null);
      setState(prev => ({ ...prev, dragSourceColumnId: null }));
    }
  }), [moveTask, setDraggingItem]);

  // Data fetching
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch("/api/todos");
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Failed to load todos");

        const updatedColumns: KanbanColumnType[] = [
          { id: '1', title: 'To-Do', color: '#F0E57F', darkColor: '#fbc02d', tasks: [] },
          { id: '2', title: 'In Progress', color: '#88C6E2', darkColor: '#0288d1', tasks: [] },
          { id: '3', title: 'Completed', color: '#8DDD90', darkColor: '#388e3c', tasks: [] },
        ];

        data.forEach((todo: any) => {
          const randomColumnIndex = Math.floor(Math.random() * 3);
          updatedColumns[randomColumnIndex].tasks.push({
            id: todo.id.toString(),
            title: todo.todo,
          });
        });

        setBoard({ columns: updatedColumns });
        setState(prev => ({ ...prev, loading: false }));
      } catch (err: any) {
        setState(prev => ({ 
          ...prev, 
          error: err.message,
          loading: false 
        }));
      }
    };

    fetchTodos();
  }, [setBoard]);

  // Auth check
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setState(prev => ({ ...prev, username: storedUsername }));
    } else {
      router.push('/login');
    }
  }, [router]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (state.isMenuOpen && !target.closest('.menu-container')) {
        setState(prev => ({ ...prev, isMenuOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.isMenuOpen]);

  // Render optimization with useMemo
  const columnContent = useMemo(() => (
    isMobile ? (
      <div className="w-full max-w-sm">
        <MemoizedKanbanColumn
          column={board.columns[state.activeColumnIndex]}
          onDragStart={dragHandlers.handleDragStart}
          onDragOver={dragHandlers.handleDragOver}
          onDrop={dragHandlers.handleDrop}
          onDragEnter={() => {}}
          onDragLeave={() => {}}
        />
        <Button
          className="w-full mt-4 bg-primary hover:bg-primary/90"
          onClick={() => setState(prev => ({ ...prev, isAddingTask: true }))}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Card
        </Button>
      </div>
    ) : (
      board.columns.map((column) => (
        <div key={column.id} className="w-[350px] flex-shrink-0">
          <MemoizedKanbanColumn
            column={column}
            onDragStart={dragHandlers.handleDragStart}
            onDragOver={dragHandlers.handleDragOver}
            onDrop={dragHandlers.handleDrop}
            onDragEnter={() => {}}
            onDragLeave={() => {}}
          />
        </div>
      ))
    )
  ), [board.columns, state.activeColumnIndex, isMobile, dragHandlers]);

  if (state.loading) return <>
<div className='flex justify-between items-center mb-8 px-4 '>
    <h1 className="text-2xl font-bold">Kanban Board</h1>
      <p className="text-2xl font-bold">Welcome, {state.username}</p>
      <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setState(prev => ({ ...prev, isAddingColumn: true }))}
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
      </div>
      
    <div className='flex justify-evenly items-center mt-15'>
      <Shimmer /> 
    <Shimmer /> 
    <Shimmer />
  </div>
  </>
  if (state.error) return <div>Error: {state.error}</div>;

  return (
    <>
      <header className="flex justify-between items-center mb-8 px-4">
        {isMobile ? (
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setState(prev => ({ ...prev, isColumnMenuOpen: !prev.isColumnMenuOpen }))}
              className="p-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <p className="text-2xl font-bold">{board.columns[state.activeColumnIndex]?.title}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <p className="text-2xl font-bold">Welcome, {state.username}</p>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setState(prev => ({ ...prev, isAddingColumn: true }))}
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

      {state.isColumnMenuOpen && isMobile && (
        <MobileMenu
          username={state.username}
          columns={board.columns}
          activeIndex={state.activeColumnIndex}
          onColumnSelect={(index: number) => {
            setState(prev => ({
              ...prev,
              activeColumnIndex: index,
              isColumnMenuOpen: false
            }));
          }}
          onClose={() => setState(prev => ({ ...prev, isColumnMenuOpen: false }))}
          onAddColumn={() => setState(prev => ({ 
            ...prev, 
            isColumnMenuOpen: false,
            isAddingColumn: true 
          }))}
          onLogout={() => {
            localStorage.removeItem('username');
            router.push('/login');
          }}
        />
      )}

      <div className={`flex ${isMobile ? 'flex-col items-center w-full' : 'flex-row w-full'} h-full justify-center`}>
        <div 
          className={`
            flex 
            ${isMobile ? 'flex-col w-full px-4 space-y-4' : 'flex-row w-full px-8'} 
            pb-4 
            ${isMobile ? 'items-center' : 'justify-evenly'}
            overflow-x-auto
          `}
          onDragEnd={dragHandlers.handleDragEnd}
        >
          {columnContent}
        </div>
      </div>

      <AddColumnDialog
        isOpen={state.isAddingColumn}
        onClose={() => setState(prev => ({ ...prev, isAddingColumn: false }))}
        title={state.newColumnTitle}
        setTitle={(title) => setState(prev => ({ ...prev, newColumnTitle: title }))}
        onAdd={handleAddColumn}
      />

      <AddTaskDialog
        isOpen={state.isAddingTask}
        onClose={() => setState(prev => ({ ...prev, isAddingTask: false, newTaskTitle: '' }))}
        title={state.newTaskTitle}
        setTitle={(title) => setState(prev => ({ ...prev, newTaskTitle: title }))}
        onAdd={handleAddTask}
        columnTitle={board.columns[state.activeColumnIndex]?.title}
      />
    </>
  );
};

export default memo(KanbanBoardComponent);