
import TodoList from '@/components/TodoList';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 perspective-1000">
      <div className="container py-10 px-4 md:py-16">
        <div className="flex flex-col items-center">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-todo-text mb-2 relative">
              Task<span className="text-todo-primary">Bloom</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-todo-primary/0 via-todo-primary to-todo-primary/0"></div>
            </h1>
            <p className="text-gray-500">Organize your day, bloom your productivity</p>
          </div>
          
          <div className="w-full max-w-2xl transform hover:rotate-y-1 transition-transform duration-300 perspective-1000">
            <TodoList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
