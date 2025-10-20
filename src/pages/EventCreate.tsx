import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import MapPicker from '../components/MapPicker';
import { Plus, X, Calendar, Clock, Users, Tag } from 'lucide-react';

const EventCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    location: '',
    lat: 0,
    lng: 0,
    start_datetime: '',
    end_datetime: '',
    capacity: '',
    tags: [] as string[],
    allow_registration: true
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to create an event');
      return;
    }

    // Validate that organization users have proper role
    if (['school', 'firm', 'university'].includes(user.role) && !user.affiliations?.length) {
      alert('Organization account required: Please complete your organization affiliation before creating events.');
      navigate('/profile');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_datetime);
    const endDate = new Date(formData.end_datetime);
    
    if (startDate >= endDate) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      // Convert empty capacity string to undefined (not 0)
      const capacityValue = formData.capacity.trim() === '' ? undefined : parseInt(formData.capacity);
      
      // Validate capacity if provided
      if (capacityValue !== undefined && (isNaN(capacityValue) || capacityValue < 1)) {
        alert('Capacity must be a positive number');
        return;
      }

      const eventData = {
        name: formData.name,
        subtitle: formData.subtitle || '',
        description: formData.description,
        location: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        start_datetime: startDate, // Convert to Date object
        end_datetime: endDate, // Convert to Date object
        capacity: capacityValue,
        tags: formData.tags,
        images: [],
        organiser_org_id: user.uid,
        createdBy: user.uid,
        status: 'published' as const,
        allow_registration: formData.allow_registration,
        registeredUsers: [],
        waitlist: []
      };

      await databaseService.createEvent(eventData);
      alert('Event created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(`Error creating event: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleLocationSelect = (location: string, lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      location,
      lat,
      lng
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Event
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Fill in the details below to create your event
        </p>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter a descriptive event name"
                minLength={3}
                maxLength={100}
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brief description (optional)"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describe your event in detail. What will attendees learn or experience?"
                minLength={10}
                maxLength={2000}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_datetime}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_datetime}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  min={formData.start_datetime || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            {/* Location */}
            <MapPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.location}
              initialLat={formData.lat}
              initialLng={formData.lng}
            />

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Leave empty for unlimited attendees"
                min="1"
                max="10000"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank for unlimited capacity
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add tags to help people find your event..."
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-primary-600 dark:hover:text-primary-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.tags.length}/10 tags added
              </p>
            </div>

            {/* Allow Registration */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_registration"
                checked={formData.allow_registration}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_registration: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="allow_registration" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Allow registration for this event
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t dark:border-gray-600">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCreate;