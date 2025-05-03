
import { useState } from 'react';
import { Todo } from '@/types';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Check, ScrollText } from "lucide-react";
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, description?: string) => void;
}

const TodoItem = ({ todo, onToggleComplete, onDelete, onEdit }: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [isHovering, setIsHovering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onEdit(todo.id, editTitle, editDescription || undefined);
      setIsEditing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="mb-2 p-4 bg-white rounded-lg shadow-md border border-gray-100 animate-fade-in transform transition-all duration-300 hover:translate-y-[-2px]">
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-todo-primary/50 focus:border-todo-primary"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full p-2 border border-gray-200 rounded h-20 resize-none focus:outline-none focus:ring-2 focus:ring-todo-primary/50 focus:border-todo-primary"
          />
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-todo-primary hover:bg-todo-secondary transition-colors"
            >
              Save
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div 
      className={cn(
        "mb-2 p-4 bg-white rounded-lg border border-gray-100 transition-all duration-300 group",
        todo.completed && "bg-gray-50 opacity-80",
        "hover:shadow-lg hover:translate-y-[-2px] transform perspective-1000"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        boxShadow: isHovering 
          ? '0 5px 15px rgba(155, 135, 245, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)' 
          : '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggleComplete(todo.id)}
          className={cn(
            "mt-1 border-2 data-[state=checked]:bg-todo-primary data-[state=checked]:border-todo-primary transition-all duration-300 hover:scale-110",
            !todo.completed && "border-todo-primary/30"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <label
              htmlFor={`todo-${todo.id}`}
              className={cn(
                "text-base font-medium text-todo-text cursor-pointer transition-all duration-300",
                todo.completed && "line-through text-gray-400"
              )}
            >
              {todo.title}
            </label>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-todo-primary hover:bg-gray-100/80 transition-transform duration-200 hover:scale-110"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-gray-100/80 transition-transform duration-200 hover:scale-110"
                onClick={() => onDelete(todo.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
          {todo.description && (
            <p className={cn(
              "text-sm text-gray-500 mt-1 transition-all duration-300",
              todo.completed && "line-through text-gray-400",
              "animate-fade-in"
            )}>
              {todo.description}
            </p>
          )}
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <ScrollText className="h-3 w-3" />
            {formatDate(todo.createdAt)}
          </div>
        </div>
      </div>
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-todo-primary/0 via-todo-primary to-todo-primary/0 transform scale-x-0 transition-transform duration-300",
        isHovering && "scale-x-100"
      )} />
    </div>
  );
};

export default TodoItem;
