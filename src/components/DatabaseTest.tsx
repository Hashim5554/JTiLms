import React, { useState } from 'react';
import { testDatabase } from '../lib/supabase';

export function DatabaseTest() {
  const [testResult, setTestResult] = useState<string>('');

  const runTest = async () => {
    setTestResult('Running test...');
    try {
      await testDatabase();
      setTestResult('Test completed - check console for details');
    } catch (error) {
      setTestResult(`Test failed: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
      <h3>Database Connection Test</h3>
      <button onClick={runTest}>Test Database Connection</button>
      <p>{testResult}</p>
    </div>
  );
} 