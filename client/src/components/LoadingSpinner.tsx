import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
    </div>
  );
};

export default LoadingSpinner;
