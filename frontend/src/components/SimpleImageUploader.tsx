import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface SimpleImageUploaderProps {
  onImageSelect: (file: File) => void;
  onError?: (error: string) => void;
}

export const SimpleImageUploader: React.FC<SimpleImageUploaderProps> = ({
  onImageSelect,
  onError,
}) => {
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('🔥 SIMPLE: File input change event triggered!');
      console.log('🔥 SIMPLE: Event target:', e.target);
      console.log('🔥 SIMPLE: Files:', e.target.files);
      
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log('🔥 SIMPLE: Selected file:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        
        // Simple validation
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
          console.log('🔥 SIMPLE: File type validation failed');
          onError?.('Please upload a JPG or PNG image');
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          console.log('🔥 SIMPLE: File size validation failed');
          onError?.('File size must be less than 10MB');
          return;
        }
        
        console.log('🔥 SIMPLE: Validation passed, calling onImageSelect');
        try {
          onImageSelect(file);
          console.log('🔥 SIMPLE: onImageSelect called successfully');
        } catch (error) {
          console.error('🔥 SIMPLE: Error calling onImageSelect:', error);
        }
      } else {
        console.log('🔥 SIMPLE: No files selected');
      }
    },
    [onImageSelect, onError]
  );

  const handleClick = useCallback(() => {
    console.log('🔥 SIMPLE: Upload area clicked');
  }, []);

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-gray-400 transition-all duration-200 bg-white"
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onClick={(e) => {
            console.log('🔥 SIMPLE: File input clicked directly');
            console.log('🔥 SIMPLE: Input element:', e.currentTarget);
          }}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Simple Upload Test
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Click to browse files
          </p>
          <p className="text-xs text-gray-400">
            JPG or PNG • Max 10MB
          </p>
        </div>
      </div>
    </div>
  );
};