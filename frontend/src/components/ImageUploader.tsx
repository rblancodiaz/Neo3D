import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useImageLoader } from '../hooks/useImageLoader';
import { clsx } from 'clsx';

// Debug test function to bypass all validation
const testDirectCallback = (onImageSelect: (file: File) => void, file: File) => {
  console.log('🔥 IMAGEUPLOADER: testDirectCallback called with:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    onImageSelectType: typeof onImageSelect
  });
  
  try {
    onImageSelect(file);
    console.log('🔥 IMAGEUPLOADER: testDirectCallback - onImageSelect completed successfully');
  } catch (error) {
    console.error('🔥 IMAGEUPLOADER: testDirectCallback - onImageSelect threw error:', error);
  }
};

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onError?: (error: string) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  onError,
  className,
  accept = 'image/jpeg,image/jpg,image/png',
  maxSize = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { loadFile, isLoading, error, dimensions, aspectRatio, reset } = useImageLoader({
    onLoad: (image) => {
      console.log('🔥 IMAGEUPLOADER: useImageLoader onLoad callback called:', {
        imageWidth: image.width,
        imageHeight: image.height,
        hasSelectedFile: !!selectedFile,
        selectedFileName: selectedFile?.name || 'null'
      });
      
      // Image loaded successfully
      if (selectedFile) {
        console.log('🔥 IMAGEUPLOADER: Calling onImageSelect with file:', selectedFile.name);
        onImageSelect(selectedFile);
        console.log('🔥 IMAGEUPLOADER: onImageSelect callback completed');
      } else {
        console.error('🔥 IMAGEUPLOADER: selectedFile is null in onLoad callback!');
      }
    },
    onError: (err) => {
      console.error('🔥 IMAGEUPLOADER: useImageLoader onError callback:', {
        errorMessage: err.message,
        errorType: typeof err,
        errorStack: err.stack
      });
      onError?.(err.message);
    },
    validateDimensions: false // TEMPORARILY DISABLE dimension validation to test
  });

  const handleFile = useCallback(
    async (file: File) => {
      console.log('🔥 IMAGEUPLOADER: handleFile called with:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      });
      
      // Basic validation
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        console.log('🔥 IMAGEUPLOADER: File type validation failed:', file.type);
        onError?.('Please upload a JPG or PNG image');
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        console.log('🔥 IMAGEUPLOADER: File size validation failed:', {
          fileSize: file.size,
          maxSizeBytes: maxSize * 1024 * 1024
        });
        onError?.(`File size must be less than ${maxSize}MB`);
        return;
      }

      console.log('🔥 IMAGEUPLOADER: Basic validation passed, storing file and creating preview');
      
      // TEMPORARY DEBUG: Test direct callback immediately
      console.log('🔥 IMAGEUPLOADER: Testing direct callback bypass...');
      testDirectCallback(onImageSelect, file);
      
      // Store the file for later use
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        console.log('🔥 IMAGEUPLOADER: FileReader loaded, setting preview');
        setPreview(result);
        setFileName(file.name);
        
        try {
          console.log('🔥 IMAGEUPLOADER: Starting loadFile for image validation');
          // Load and validate image
          await loadFile(file);
          console.log('🔥 IMAGEUPLOADER: loadFile completed successfully');
        } catch (error) {
          console.error('🔥 IMAGEUPLOADER: Failed to load image:', error);
          onError?.('Failed to process image file');
        }
      };
      
      reader.onerror = (error) => {
        console.error('🔥 IMAGEUPLOADER: FileReader error:', error);
        onError?.('Failed to read image file');
      };
      
      console.log('🔥 IMAGEUPLOADER: Starting FileReader.readAsDataURL');
      reader.readAsDataURL(file);
    },
    [maxSize, onError, loadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      console.log('🔥 IMAGEUPLOADER: handleDrop triggered');
      const files = Array.from(e.dataTransfer.files);
      console.log('🔥 IMAGEUPLOADER: Dropped files:', {
        filesCount: files.length,
        firstFileName: files[0]?.name || 'none'
      });

      if (files.length > 0) {
        console.log('🔥 IMAGEUPLOADER: Calling handleFile with dropped file:', files[0].name);
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('🔥 IMAGEUPLOADER: handleFileInput triggered');
      const files = e.target.files;
      console.log('🔥 IMAGEUPLOADER: Files from input:', {
        filesCount: files?.length || 0,
        firstFileName: files?.[0]?.name || 'none'
      });
      
      if (files && files.length > 0) {
        console.log('🔥 IMAGEUPLOADER: Calling handleFile with:', files[0].name);
        handleFile(files[0]);
      } else {
        console.log('🔥 IMAGEUPLOADER: No files selected');
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setSelectedFile(null);
    reset();
  }, [reset]);

  return (
    <div className={clsx('w-full', className)}>
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            'relative border-2 border-dashed rounded-xl p-8',
            'transition-all duration-200 cursor-pointer',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 bg-white',
            isLoading && 'opacity-50 cursor-wait'
          )}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <Upload
              size={48}
              className={clsx(
                'mb-4',
                isDragging ? 'text-primary-500' : 'text-gray-400'
              )}
            />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragging ? 'Drop your image here' : 'Upload hotel image'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-gray-400">
              JPG or PNG • Max {maxSize}MB • Min 800×600px
            </p>
          </div>
        </div>
      ) : (
        <div className="relative bg-white rounded-xl shadow-md overflow-hidden">
          {/* Preview image */}
          <div className="relative aspect-video bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            
            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
              title="Remove image"
            >
              <X size={20} className="text-gray-700" />
            </button>
          </div>
          
          {/* Image info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <ImageIcon size={20} className="text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {fileName}
                </p>
                {dimensions && (
                  <p className="text-xs text-gray-500 mt-1">
                    {dimensions.width} × {dimensions.height}px
                    {aspectRatio && ` • ${aspectRatio.toFixed(2)} ratio`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}
    </div>
  );
};