
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

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title: string, description?: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos([newTodo, ...todos]);
    toast({
      title: "Todo added",
      description: "Your todo has been added successfully.",
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
      title: "Todo deleted",
      description: "Your todo has been deleted.",
    });
  };

  const editTodo = (id: string, title: string, description?: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, title, description } : todo
      )
    );
    toast({
      title: "Todo updated",
      description: "Your todo has been updated.",
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
    <div className="w-full notepad-container">
      <div className="bg-white rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.05)] backdrop-blur-sm border border-gray-200/50 transform transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_20px_25px_-5px_rgba(155,135,245,0.2),0_10px_10px_-5px_rgba(155,135,245,0.1)]">
        <div className="bg-gradient-to-r from-todo-primary/10 via-todo-primary/20 to-todo-primary/10 h-2 rounded-t-lg"></div>
        
        <div className="p-6 space-y-4">
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
                      <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm border border-gray-100 backdrop-blur-sm">
                        <p className="text-gray-500">
                          {filter === 'all' 
                            ? "You've added some todos, but they're filtered out."
                            : filter === 'active'
                            ? "No active todos found."
                            : "No completed todos yet."}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>
            </>
          ) : (
            <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm border border-gray-100 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-todo-primary mb-2">Your todo list is empty</h3>
              <p className="text-gray-500">Add a new todo to get started.</p>
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-gray-100 via-white to-gray-100 h-3 rounded-b-lg shadow-inner"></div>
      </div>
    </div>
  );
};

export default TodoList;
