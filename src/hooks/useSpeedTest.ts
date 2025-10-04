import { useState } from 'react';

export const useSpeedTest = () => {
  const [isTesting, setIsTesting] = useState(false);

  const runTest = () => {
    setIsTesting(true);
    setTimeout(() => setIsTesting(false), 3000);
  };

  return { isTesting, runTest };
};