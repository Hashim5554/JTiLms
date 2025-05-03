
import TodoList from '@/components/TodoList';

const Index = () => {
  return (
    <div className="min-h-screen bg-todo-bg">
      <div className="container py-10 px-4 md:py-16">
        <div className="flex flex-col items-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-todo-text mb-2">
              Task<span className="text-todo-primary">Bloom</span>
            </h1>
            <p className="text-gray-500">Organize your day, bloom your productivity</p>
          </div>
          
          <TodoList />
        </div>
      </div>
    </div>
  );
};

export default Index;
