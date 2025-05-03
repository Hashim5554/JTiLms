
import { TodoFilter } from '@/types';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface TodoFilterProps {
  activeFilter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  todoCount: {
    all: number;
    active: number;
    completed: number;
  };
}

const TodoFilterComponent = ({ activeFilter, onFilterChange, todoCount }: TodoFilterProps) => {
  const filters: Array<{ value: TodoFilter; label: string; count: number }> = [
    { value: 'all', label: 'All', count: todoCount.all },
    { value: 'active', label: 'Active', count: todoCount.active },
    { value: 'completed', label: 'Completed', count: todoCount.completed }
  ];

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex p-1 bg-gray-100 rounded-lg">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant="ghost"
            className={cn(
              "text-sm px-4 py-2 rounded-md transition-colors",
              activeFilter === filter.value
                ? "bg-white text-todo-primary shadow-sm"
                : "text-gray-600 hover:text-todo-primary"
            )}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className={cn(
                "ml-2 px-2 py-0.5 text-xs rounded-full",
                activeFilter === filter.value
                  ? "bg-todo-primary text-white"
                  : "bg-gray-200 text-gray-700"
              )}>
                {filter.count}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TodoFilterComponent;
