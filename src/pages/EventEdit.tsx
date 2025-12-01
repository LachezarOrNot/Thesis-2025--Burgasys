import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Event, EventStatus } from '../types';
import {
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Users,
  Tag,
  Image as ImageIcon,
  Upload,
  X,
  Plus,
  AlertCircle,
  Globe
} from 'lucide-react';
import MapLocationPicker from '../components/MapLocationPicker';
import { useTranslation } from 'react-i18next';

const EventEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
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
    status: 'published' as EventStatus,
    allow_registration: true,
    images: [] as string[] // Array to store Base64 image strings
  });

  const [newTag, setNewTag] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const eventData = await databaseService.getEvent(id);

      if (!eventData) {
        setError('Event not found');
        return;
      }

      // Check permissions
      if (user?.role !== 'admin' && user?.uid !== eventData.createdBy) {
        setError('You do not have permission to edit this event');
        return;
      }

      setEvent(eventData);

      // Helper function to convert Date to local ISO string for datetime-local input
      const toLocalISOString = (date: Date | null): string => {
        if (!date) return '';
        const d = new Date(date);
        // Convert to local time string for datetime-local input
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Populate form data
      setFormData({
        name: eventData.name || '',
        subtitle: eventData.subtitle || '',
        description: eventData.description || '',
        location: eventData.location || '',
        lat: eventData.lat || 0,
        lng: eventData.lng || 0,
        start_datetime: toLocalISOString(eventData.start_datetime),
        end_datetime: toLocalISOString(eventData.end_datetime),
        capacity: eventData.capacity?.toString() || '',
        tags: eventData.tags || [],
        status: eventData.status || 'published',
        allow_registration: eventData.allow_registration ?? true,
        images: eventData.images || []
      });

    } catch (error) {
      console.error('Error loading event:', error);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !id) return;

    try {
      setSaving(true);
      setError('');

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Event name is required');
        return;
      }

      if (!formData.start_datetime || !formData.end_datetime) {
        setError('Start and end datetime are required');
        return;
      }

      if (!formData.location.trim()) {
        setError('Location is required');
        return;
      }

      // Validate location coordinates
      if (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0) {
        setError('Please select a valid location on the map');
        return;
      }

      // Validate dates
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);
      
      if (startDate >= endDate) {
        setError('End date must be after start date');
        return;
      }

      // Handle subtitle conversion - ensure it's either string or undefined, not null
      const subtitle = formData.subtitle.trim() || undefined;
      
      const updates = {
        name: formData.name.trim(),
        subtitle: subtitle, // This is now string | undefined, not string | null
        description: formData.description.trim(),
        location: formData.location.trim(),
        lat: formData.lat,
        lng: formData.lng,
        start_datetime: startDate,
        end_datetime: endDate,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined, // Use undefined instead of null
        tags: formData.tags,
        images: formData.images, // Base64 images
        status: formData.status,
        allow_registration: formData.allow_registration
      };

      await databaseService.updateEvent(id, updates);

      alert('Event updated successfully!');
      navigate(`/events/${id}`);

    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      lat,
      lng,
      location: address || prev.location
    }));
  };

  // Convert file to Base64 string - FIXED VERSION
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
    });
  };

  // Optimize image by reducing quality and size
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max width 800px)
        const maxWidth = 800;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw and compress with 80% quality
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please upload only image files');
          continue;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          alert('Image size must be less than 2MB');
          continue;
        }

        try {
          // Optimize image first
          const optimizedBlob = await optimizeImage(file);
          const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });

          // Convert to Base64
          const base64String = await fileToBase64(optimizedFile);

          // Add to images array
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, base64String]
          }));
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Failed to process image');
          continue;
        }
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImages(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center gap-2 text-primary-500 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/events/${id}`)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Event
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Update your event details
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || uploadingImages}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter event name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a brief subtitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your event..."
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Event Images
              </h2>

              <div className="space-y-4">
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload images
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG up to 2MB (will be optimized)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploading Indicator */}
                {uploadingImages && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Processing images...
                    </p>
                  </div>
                )}

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((base64String, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={base64String}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            console.error('Image failed to load:', e);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Storage Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> Images are stored as Base64 strings in the database to avoid storage costs.
                    {formData.images.length > 0 && ` Current images: ${formData.images.length}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date & Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_datetime}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_datetime}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg"
                >
                  <Globe className="w-4 h-4" />
                  {showMap ? 'Hide Map' : 'Use Map'}
                </button>
              </div>

              <div className="space-y-4">
                {showMap ? (
                  <MapLocationPicker
                    latitude={formData.lat}
                    longitude={formData.lng}
                    onLocationSelect={handleLocationSelect}
                    onLocationNameChange={(address) => setFormData(prev => ({ ...prev, location: address }))}
                    locationName={formData.location}
                  />
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter event location"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Click "Use Map" above to select location on an interactive map
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={formData.lat || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter latitude"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={formData.lng || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter longitude"
                        />
                      </div>
                    </div>
                  </>
                )}

                {(formData.lat !== 0 || formData.lng !== 0) && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Location coordinates set: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="No limit if empty"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_registration"
                    checked={formData.allow_registration}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_registration: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="allow_registration" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow registration
                  </label>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </h2>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-200 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary-900 dark:hover:text-primary-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Event Info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Current Event Info
              </h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Event ID</p>
                  <p className="font-mono text-gray-700 dark:text-gray-300">{id}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Created By</p>
                  <p className="text-gray-700 dark:text-gray-300">{event?.createdBy}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Organization ID</p>
                  <p className="text-gray-700 dark:text-gray-300">{event?.organiser_org_id || 'None'}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Registered Users</p>
                  <p className="text-gray-700 dark:text-gray-300">{event?.registeredUsers?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEdit;