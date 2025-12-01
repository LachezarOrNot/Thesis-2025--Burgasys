import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { EventStatus, EventCreationRequest } from '../types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Image as ImageIcon,
  Upload,
  X,
  Plus,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EventCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    location: '',
    lat: 0,
    lng: 0,
    start_datetime: '', // Holds the datetime-local string (e.g., "2025-12-01T10:00")
    end_datetime: '', // Holds the datetime-local string
    capacity: '',
    tags: [] as string[],
    status: 'published' as EventStatus,
    allow_registration: true,
    images: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  // Check user permissions
  const isAdmin = user?.role === 'admin';
  const canRequestEvents = user && ['school', 'university', 'firm'].includes(user.role);
  const hasAccess = isAdmin || canRequestEvents;

  // Get organization information safely
  const getOrganizationInfo = () => {
    if (!user) return { id: '', name: '' };
    
    // For admin creating events directly, they might not have an affiliated organization
    if (isAdmin) {
      return { id: '', name: 'Administrator' };
    }
    
    // For organization users, get their affiliated organization
    const orgId = user.affiliatedOrganizationId || '';
    const orgName = 'Your Organization'; // This should come from organization data
    
    return { id: orgId, name: orgName };
  };

  // Helper function to convert undefined/empty values to null for clean Firestore storage
  // ⚠️ CRUCIAL FIX: Ensure this function doesn't recursively traverse Date objects
  const prepareDataForFirestore = (obj: any): any => {
    // If it's a Date object, return it as is so Firestore can serialize it
    if (obj instanceof Date) {
        return obj; 
    }
    
    if (obj === undefined) return null;
    if (obj === null) return null;
    
    if (Array.isArray(obj)) {
      return obj.map(item => prepareDataForFirestore(item));
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = prepareDataForFirestore(obj[key]);
        cleaned[key] = value;
      });
      return cleaned;
    }
    
    return obj;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!user) {
    setError(t('eventCreate.errors.loginRequired'));
    return;
  }

  try {
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.name.trim()) {
      setError(t('eventCreate.errors.nameRequired'));
      return;
    }

    if (!formData.start_datetime || !formData.end_datetime) {
      setError(t('eventCreate.errors.datetimeRequired'));
      return;
    }

    // ✅ CORRECT DATE HANDLING: The new Date() constructor handles the 
    // "YYYY-MM-DDTHH:MM" string from datetime-local by interpreting it 
    // as a local time and correctly converting it to a UTC timestamp.
    const startDate = new Date(formData.start_datetime);
    const endDate = new Date(formData.end_datetime);
    
    // Validate the dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError(t('eventCreate.errors.invalidDate'));
      return;
    }

    // Validate dates are in the future
    const now = new Date();
    // Using 5 minute buffer to account for form submission time
    if (startDate.getTime() < now.getTime() - (5 * 60 * 1000)) { 
      setError(t('eventCreate.errors.dateInPast'));
      return;
    }

    if (startDate >= endDate) {
      setError(t('eventCreate.errors.dateValidation'));
      return;
    }

    console.log('🟢 DATE DEBUG - Event Creation:');
    console.log('Input start_datetime:', formData.start_datetime);
    console.log('Parsed startDate (Local Timezone Display):', startDate);
    console.log('Parsed startDate (UTC Timestamp):', startDate.toISOString());

    // Get organization information
    const organizationInfo = getOrganizationInfo();
    
    // For non-admin users, ensure they have an organization
    if (!isAdmin && !organizationInfo.id) {
      setError(t('eventCreate.errors.organizationRequired'));
      return;
    }

    // Create event data - handle capacity properly for Firestore
    const capacityValue = formData.capacity ? parseInt(formData.capacity) : null;

    const eventData = {
      name: formData.name.trim(),
      subtitle: formData.subtitle.trim() || null,
      description: formData.description.trim(),
      location: formData.location.trim(),
      lat: formData.lat,
      lng: formData.lng,
      // Pass the Date objects directly. The Firestore SDK will convert them to Timestamps.
      start_datetime: startDate,
      end_datetime: endDate,
      capacity: capacityValue,
      tags: formData.tags,
      images: formData.images,
      organiser_org_id: organizationInfo.id,
      createdBy: user.uid,
      status: isAdmin ? formData.status : 'pending_approval',
      allow_registration: formData.allow_registration,
      registeredUsers: [],
      waitlist: []
    };

    console.log('Creating event with data:', eventData);

    // The prepareDataForFirestore ensures no undefined values are sent 
    // and correctly handles the Date objects due to the fix above.
    const preparedEventData = prepareDataForFirestore(eventData);

    if (isAdmin) {
      await databaseService.createEvent(preparedEventData);
      alert(t('eventCreate.success.event'));
      navigate('/events');
    } else if (canRequestEvents) {
      // Event request for school/university/firm
      const eventRequestData: Omit<EventCreationRequest, 'id' | 'submittedAt'> = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Unknown User',
        organizationId: organizationInfo.id,
        organizationName: organizationInfo.name,
        eventData: preparedEventData, // already prepared above
        status: 'pending',
        reviewedAt: undefined,
        reviewedBy: undefined,
        reason: undefined
      };
      
      // Prepare the entire request data for Firestore (just handles top-level nulls)
      const preparedRequestData = prepareDataForFirestore(eventRequestData);
      await databaseService.createEventRequest(preparedRequestData);
      alert(t('eventCreate.success.request'));
      navigate('/events');
    }
    
  } catch (error) {
    console.error('Error creating event:', error);
    setError(t('eventCreate.errors.general'));
  } finally {
    setLoading(false);
  }
};

  // The rest of the component remains the same for brevity, 
  // assuming image and tag handlers are stable.

  // ... (omitted fileToBase64, optimizeImage, handleImageUpload, handleRemoveImage,
  // handleAddTag, handleRemoveTag, handleKeyPress, redirection, and JSX)

// The rest of your component's JSX rendering logic...
/*
...
*/

// --- The JSX and other unchanged logic continues below ---

  // Convert file to Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
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
      if (e.target) {
        e.target.value = '';
      }
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

  // Redirect unauthorized users
  if (!user) {
    navigate('/login');
    return null;
  }

  // Check if user has permission to access this page
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('eventCreate.accessDenied.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('eventCreate.accessDenied.message')}
          </p>
        </div>
      </div>
    );
  }

  // Show organization info for non-admin users
  const organizationInfo = getOrganizationInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {isAdmin ? t('eventCreate.title') : t('eventCreate.requestTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isAdmin 
              ? t('eventCreate.description')
              : t('eventCreate.requestDescription')
            }
          </p>

          {/* Organization info for non-admin users */}
          {!isAdmin && organizationInfo.id && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('eventCreate.organizationInfo', { organizationName: organizationInfo.name })}
                </p>
              </div>
            </div>
          )}

          {/* Info banner for non-admin users */}
          {!isAdmin && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('eventCreate.approvalNote')}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('eventCreate.sections.basicInfo')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('eventCreate.form.eventName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('eventCreate.form.eventNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('eventCreate.form.subtitle')}
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('eventCreate.form.subtitlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('eventCreate.form.description')}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('eventCreate.form.descriptionPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                {t('eventCreate.sections.images')}
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
                        {t('eventCreate.form.uploadImages')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('eventCreate.form.uploadInfo')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploading Indicator */}
                {uploadingImages && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {t('eventCreate.form.processingImages')}
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
                            // You can set a placeholder image here if needed
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
                    {t('eventCreate.form.imageStorageNote')}
                    {formData.images.length > 0 && ` Current images: ${formData.images.length}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('eventCreate.sections.dateTime')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('eventCreate.form.startDateTime')} *
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
                    {t('eventCreate.form.endDateTime')} *
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('eventCreate.sections.location')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('eventCreate.form.location')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('eventCreate.form.locationPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>
          

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings - Only show for admin */}
            {isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('eventCreate.sections.settings')}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('eventCreate.form.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as EventStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="pending_approval">Pending Approval</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('eventCreate.form.capacity')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder={t('eventCreate.form.capacityPlaceholder')}
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
                      {t('eventCreate.form.allowRegistration')}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                {t('eventCreate.sections.tags')}
              </h2>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('eventCreate.form.addTag')}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {isAdmin ? t('eventCreate.form.creatingEvent') : t('eventCreate.form.submittingRequest')}
                </>
              ) : (
                isAdmin ? t('eventCreate.form.createEvent') : t('eventCreate.form.requestEvent')
              )}
            </button>

            {/* Info for non-admin users */}
            {!isAdmin && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                      {t('eventCreate.requestTitle')}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      {t('eventCreate.approvalNote')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default EventCreate;