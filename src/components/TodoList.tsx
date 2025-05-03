
import { useState, useEffect } from 'react';
import { Todo, TodoFilter } from '@/types';
import TodoInput from './TodoInput';
import TodoItem from './TodoItem';
import TodoFilterComponent from './TodoFilter';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [rotateY, setRotateY] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const { toast } = useToast();

  // Load todos from localStorage on initial render
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.error('Failed to parse todos from localStorage', error);
        localStorage.removeItem('todos');
      }
    }
  }, []);

  // 3D notebook effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Calculate distance from center (normalized to -1 to 1 range)
      const moveX = (e.clientX - centerX) / (window.innerWidth / 2);
      const moveY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      // Apply subtle rotation based on mouse position
      setRotateY(moveX * 2); // Max 2 degrees rotation
      setRotateX(-moveY * 1); // Max 1 degree rotation (inverted)
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title: string, description?: string) => {
    console.log("Adding todo:", title, description);
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos(prevTodos => [newTodo, ...prevTodos]);
    toast({
      title: "Task added",
      description: "Your task has been added to the notebook.",
    });
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    toast({
      title: "Task deleted",
      description: "Your task has been removed from the notebook.",
    });
  };

  const editTodo = (id: string, title: string, description?: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, title, description } : todo
      )
    );
    toast({
      title: "Task updated",
      description: "Your task has been updated in the notebook.",
    });
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const todoCount = {
    all: todos.length,
    active: todos.filter((todo) => !todo.completed).length,
    completed: todos.filter((todo) => todo.completed).length,
  };

  return (
    <div className="w-full notepad-container transform-style-3d">
      <div 
        className="notepad-paper"
        style={{
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Notebook binding effect */}
        <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-todo-secondary/30 to-transparent rounded-l-lg z-10"></div>
        <div className="absolute left-0 top-0 h-full w-[3px] bg-todo-secondary/50 rounded-l-lg z-10"></div>
        
        {/* Notebook page elements */}
        <div className="absolute left-0 top-0 bottom-0 w-[20px] z-0">
          {Array(15).fill(0).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-todo-primary/30 ml-1 mt-4" />
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-todo-primary/10 via-todo-primary/20 to-todo-primary/10 h-2 rounded-t-lg"></div>
        
        <div className="p-6 space-y-4 bg-white/95 min-h-[500px]">
          <TodoInput onAddTodo={addTodo} />
          
          {todos.length > 0 ? (
            <>
              <TodoFilterComponent 
                activeFilter={filter} 
                onFilterChange={setFilter} 
                todoCount={todoCount} 
              />
              
              <div className="relative">
                <ScrollArea className="h-[400px] rounded-md pr-4">
                  <div className="space-y-3 pr-4">
                    {filteredTodos.length > 0 ? (
                      filteredTodos.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onToggleComplete={toggleComplete}
                          onDelete={deleteTodo}
                          onEdit={editTodo}
                        />
                      ))
                    ) : (
                      <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm border border-gray-200 backdrop-blur-sm">
                        <p className="text-gray-500">
                          {filter === 'all' 
                            ? "You've added some tasks, but they're filtered out."
                            : filter === 'active'
                            ? "No active tasks found."
                            : "No completed tasks yet."}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>
            </>
          ) : (
            <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm border border-gray-200 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-todo-primary mb-2">Your notebook is empty</h3>
              <p className="text-gray-500">Add a new task to get started.</p>
            </div>
          )}
        </div>
        
        {/* Notebook ruled lines background */}
        <div className="absolute inset-0 z-[-1] pointer-events-none">
          {Array(20).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="w-full h-[1px] bg-blue-100/40" 
              style={{ top: `${120 + i * 25}px`, position: 'absolute' }} 
            />
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-gray-100 via-white to-gray-100 h-3 rounded-b-lg shadow-inner"></div>
        
        {/* Page corner fold effect */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/90 shadow-sm"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
            transform: 'rotate(0deg)',
          }}
        >
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-gray-200/50"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
