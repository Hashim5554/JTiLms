import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../contexts/SessionContext";

export function Other() {
  const { user } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
        
        if (error) throw error;
        setData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Other Page</h1>
      <p>Welcome, {user?.username || 'User'}!</p>
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Sample Data:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}