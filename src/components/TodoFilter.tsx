
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
    { value: 'all', label: 'All Pages', count: todoCount.all },
    { value: 'active', label: 'Active', count: todoCount.active },
    { value: 'completed', label: 'Completed', count: todoCount.completed }
  ];

  return (
    <div className="flex justify-center mb-6 transform-style-3d">
      <div className="inline-flex p-1 bg-gray-100/70 backdrop-blur-sm rounded-lg shadow-inner overflow-hidden perspective-1000">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant="ghost"
            className={cn(
              "text-sm px-4 py-2 rounded-md transition-all duration-300 relative overflow-hidden",
              activeFilter === filter.value
                ? "bg-white text-todo-primary shadow-sm transform translate-z-2 translate-y-[-1px]"
                : "text-gray-600 hover:text-todo-primary hover:bg-white/50"
            )}
            onClick={() => onFilterChange(filter.value)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="relative z-10">
              {filter.label}
              {filter.count > 0 && (
                <span className={cn(
                  "ml-2 px-2 py-0.5 text-xs rounded-full transition-all duration-300",
                  activeFilter === filter.value
                    ? "bg-todo-primary text-white"
                    : "bg-gray-200 text-gray-700",
                  "transform hover:scale-105"
                )}>
                  {filter.count}
                </span>
              )}
            </div>
            {activeFilter === filter.value && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-todo-primary" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TodoFilterComponent;
