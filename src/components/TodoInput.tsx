
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface TodoInputProps {
  onAddTodo: (title: string, description?: string) => void;
}

const TodoInput = ({ onAddTodo }: TodoInputProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTodo(title, description || undefined);
      setTitle('');
      setDescription('');
      if (showDescription && !description) {
        setShowDescription(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 mb-6">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-white shadow-sm border-todo-primary/20"
        />
        <Button 
          type="submit" 
          className="bg-todo-primary hover:bg-todo-secondary transition-colors"
        >
          <Plus className="mr-1 h-5 w-5" />
          Add
        </Button>
      </div>
      
      {showDescription ? (
        <Input
          type="text"
          placeholder="Add description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white shadow-sm border-todo-primary/20"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          className="text-sm text-todo-secondary hover:text-todo-primary transition-colors"
        >
          + Add description
        </button>
      )}
    </form>
  );
};

export default TodoInput;
