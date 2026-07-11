import React, { useState } from 'react';
import CommandCenter from './components/CommandCenter';
import EntryScreen from './components/EntryScreen';

function App() {
  const [isBooted, setIsBooted] = useState(false);

  return (
    <>
      {!isBooted ? (
        <EntryScreen onProceed={() => setIsBooted(true)} />
      ) : (
        <CommandCenter />
      )}
    </>
  );
}

export default App;
