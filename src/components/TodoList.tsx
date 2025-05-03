
import { useState, useEffect } from 'react';
import { Todo, TodoFilter } from '@/types';
import TodoInput from './TodoInput';
import TodoItem from './TodoItem';
import TodoFilterComponent from './TodoFilter';
import { useToast } from '@/hooks/use-toast';

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
    <div className="w-full max-w-2xl">
      <TodoInput onAddTodo={addTodo} />
      
      {todos.length > 0 ? (
        <>
          <TodoFilterComponent 
            activeFilter={filter} 
            onFilterChange={setFilter} 
            todoCount={todoCount} 
          />
          
          <div className="space-y-3">
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
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
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
        </>
      ) : (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-todo-primary mb-2">Your todo list is empty</h3>
          <p className="text-gray-500">Add a new todo to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TodoList;
