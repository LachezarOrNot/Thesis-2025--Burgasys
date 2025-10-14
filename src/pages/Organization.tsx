import React from 'react';
import { useParams } from 'react-router-dom';

const Organization: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Organization Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Organization details and events
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-4">Organization profile page for: {id}</p>
            <p>This page will show organization details and their events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Organization;