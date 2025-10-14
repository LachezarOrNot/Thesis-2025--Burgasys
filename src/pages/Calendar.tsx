import React from 'react';

const Calendar: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Event Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          View all events in calendar format
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-4">Calendar view coming soon!</p>
            <p>This feature will be implemented in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;