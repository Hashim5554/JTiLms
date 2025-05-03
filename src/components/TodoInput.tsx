
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Book } from "lucide-react";
import { cn } from '@/lib/utils';

interface TodoInputProps {
  onAddTodo: (title: string, description?: string) => void;
}

const TodoInput = ({ onAddTodo }: TodoInputProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [elevation, setElevation] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTodo(title.trim(), description.trim() || undefined);
      setTitle('');
      setDescription('');
      if (showDescription && !description) {
        setShowDescription(false);
      }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "w-full space-y-3 mb-3 p-4 rounded-lg transition-all duration-300",
        isFocused ? "bg-white/80 shadow-md" : "bg-transparent"
      )}
      onMouseEnter={() => setElevation(5)}
      onMouseLeave={() => !isFocused && setElevation(0)}
      style={{
        transform: `translateZ(${elevation}px)`,
        transformStyle: 'preserve-3d'
      }}
    >
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Write in your notebook..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setElevation(5);
            }}
            onBlur={() => {
              setIsFocused(false);
              setElevation(0);
            }}
            className={cn(
              "flex-1 bg-white shadow-sm border-todo-primary/20 transition-all duration-300",
              isFocused && "ring-2 ring-todo-primary/30 border-todo-primary/40 shadow-lg",
              "transform perspective-1000"
            )}
          />
          <Book 
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-todo-secondary opacity-50",
              isFocused || title ? "opacity-0" : "opacity-50",
              "transition-opacity duration-300"
            )}
          />
        </div>
        <Button 
          type="submit" 
          className={cn(
            "bg-todo-primary hover:bg-todo-secondary transition-all duration-300",
            "transform hover:scale-105 active:scale-95 hover:shadow-lg",
            "hover:translate-z-2"
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Plus className="mr-1 h-5 w-5" />
          Add
        </Button>
      </div>
      
      {showDescription ? (
        <div className="animate-fade-in">
          <Input
            type="text"
            placeholder="Add description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full bg-white shadow-sm border-todo-primary/20 transition-all duration-300",
              isFocused && "ring-2 ring-todo-primary/30 border-todo-primary/40 shadow-lg"
            )}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDescription(true)}
          className="text-sm text-todo-secondary hover:text-todo-primary transition-all duration-300 hover:translate-x-1 transform"
        >
          + Add notes
        </button>
      )}
    </form>
  );
};

export default TodoInput;
