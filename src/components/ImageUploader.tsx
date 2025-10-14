import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { databaseService } from '../services/database';

interface ImageUploaderProps {
  onImagesChange: (imageUrls: string[]) => void;
  existingImages?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, existingImages = [] }) => {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const newImageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          alert('File size must be less than 10MB');
          continue;
        }
        
        const path = `events/${Date.now()}-${file.name}`;
        const url = await databaseService.uploadFile(file, path);
        newImageUrls.push(url);
      }

      const updatedImages = [...images, ...newImageUrls];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Event Images
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop images here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Select Images'}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            PNG, JPG, GIF up to 10MB each
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Uploaded Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Event image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;