import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Event } from '../types';
import { databaseService } from '../services/database';
import { Check, X, Building, Calendar } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('organizations');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgsData, eventsData] = await Promise.all([
        databaseService.getOrganizations(),
        databaseService.getEvents()
      ]);
      setOrganizations(orgsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleVerifyOrganization = async (orgId: string, verified: boolean) => {
    try {
      await databaseService.updateOrganization(orgId, { verified });
      loadData();
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const pendingOrganizations = organizations.filter(org => !org.verified);
  const pendingEvents = events.filter(event => event.status === 'pending_approval');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Manage organizations and events
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b dark:border-gray-600">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('organizations')}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'organizations'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Building className="w-4 h-4 inline mr-2" />
                Organizations ({pendingOrganizations.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'events'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Events ({pendingEvents.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'organizations' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pending Organization Verifications
                </h3>
                {pendingOrganizations.length > 0 ? (
                  <div className="space-y-4">
                    {pendingOrganizations.map(org => (
                      <div key={org.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{org.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{org.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{org.address}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{org.phone} • {org.email}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVerifyOrganization(org.id, true)}
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                              title="Verify Organization"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyOrganization(org.id, false)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                              title="Reject Organization"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p>No pending organization verifications</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Events Pending Approval
                </h3>
                {pendingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {pendingEvents.map(event => (
                      <div key={event.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{event.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(event.start_datetime).toLocaleDateString()} • {event.location}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {event.description}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                              Approve
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p>No events pending approval</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;