import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, MapPin, Plus, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Here's what's happening with your events.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <Calendar className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
            <p className="text-2xl font-bold text-primary-600">0</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <Users className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Registrations</h3>
            <p className="text-2xl font-bold text-primary-600">0</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <MapPin className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Locations</h3>
            <p className="text-2xl font-bold text-primary-600">0</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/events/create"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
            <Link 
              to="/events"
              className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Browse Events
            </Link>
            <Link 
              to="/calendar"
              className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              View Calendar
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;