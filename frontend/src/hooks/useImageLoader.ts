import { useState, useEffect, useCallback } from 'react';

interface UseImageLoaderOptions {
  url?: string;
  onLoad?: (image: HTMLImageElement) => void;
  onError?: (error: Error) => void;
  validateDimensions?: boolean;
  minWidth?: number;
  minHeight?: number;
}

interface ImageLoaderState {
  image: HTMLImageElement | null;
  isLoading: boolean;
  error: Error | null;
  dimensions: { width: number; height: number } | null;
  aspectRatio: number | null;
}

export const useImageLoader = ({
  url,
  onLoad,
  onError,
  validateDimensions = true,
  minWidth = 800,
  minHeight = 600,
}: UseImageLoaderOptions = {}): ImageLoaderState & {
  loadImage: (url: string) => void;
  loadFile: (file: File) => Promise<void>;
  reset: () => void;
} => {
  const [state, setState] = useState<ImageLoaderState>({
    image: null,
    isLoading: false,
    error: null,
    dimensions: null,
    aspectRatio: null,
  });

  const loadImage = useCallback(
    (imageUrl: string) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const dimensions = {
          width: img.width,
          height: img.height,
        };

        // Validate dimensions if required
        if (validateDimensions) {
          if (img.width < minWidth || img.height < minHeight) {
            const error = new Error(
              `Image dimensions must be at least ${minWidth}x${minHeight}px. Current: ${img.width}x${img.height}px`
            );
            setState({
              image: null,
              isLoading: false,
              error,
              dimensions: null,
              aspectRatio: null,
            });
            onError?.(error);
            return;
          }
        }

        setState({
          image: img,
          isLoading: false,
          error: null,
          dimensions,
          aspectRatio: img.width / img.height,
        });

        onLoad?.(img);
      };

      img.onerror = () => {
        const error = new Error(`Failed to load image: ${imageUrl}`);
        setState({
          image: null,
          isLoading: false,
          error,
          dimensions: null,
          aspectRatio: null,
        });
        onError?.(error);
      };

      img.src = imageUrl;
    },
    [onLoad, onError, validateDimensions, minWidth, minHeight]
  );

  const loadFile = useCallback(
    async (file: File) => {
      console.log('🔥 USEIMAGELOADER: loadFile called with:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        validateDimensions,
        minWidth,
        minHeight
      });
      
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // Create object URL and load image once
        const url = URL.createObjectURL(file);
        console.log('🔥 USEIMAGELOADER: Created object URL:', url);
        
        const img = new Image();
        img.onload = () => {
          console.log('🔥 USEIMAGELOADER: Image loaded successfully:', {
            width: img.width,
            height: img.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });
          
          // Validate dimensions after loading
          const dimensions = { width: img.width, height: img.height };
          const isValidSize = !validateDimensions || (img.width >= minWidth && img.height >= minHeight);
          
          console.log('🔥 USEIMAGELOADER: Dimension validation:', {
            dimensions,
            isValidSize,
            validateDimensions,
            minWidth,
            minHeight
          });
          
          if (!isValidSize) {
            const error = new Error(
              `Image dimensions must be at least ${minWidth}x${minHeight}px. Current: ${img.width}x${img.height}px`
            );
            console.log('🔥 USEIMAGELOADER: Dimension validation failed, calling onError');
            setState({
              image: null,
              isLoading: false,
              error,
              dimensions: null,
              aspectRatio: null,
            });
            onError?.(error);
            URL.revokeObjectURL(url);
            return;
          }
          
          // Image is valid, update state and trigger callback
          console.log('🔥 USEIMAGELOADER: Image validation passed, updating state and calling onLoad');
          setState({
            image: img,
            isLoading: false,
            error: null,
            dimensions,
            aspectRatio: dimensions.width / dimensions.height,
          });
          
          console.log('🔥 USEIMAGELOADER: About to call onLoad callback');
          onLoad?.(img);
          console.log('🔥 USEIMAGELOADER: onLoad callback completed');
          URL.revokeObjectURL(url); // Clean up
        };

        img.onerror = (error) => {
          console.error('🔥 USEIMAGELOADER: Image loading error:', error);
          const err = new Error('Failed to load image file');
          setState({
            image: null,
            isLoading: false,
            error: err,
            dimensions: null,
            aspectRatio: null,
          });
          onError?.(err);
          URL.revokeObjectURL(url);
        };

        console.log('🔥 USEIMAGELOADER: Setting image src to object URL');
        img.src = url;
      } catch (error) {
        console.error('🔥 USEIMAGELOADER: Exception in loadFile:', error);
        const err = error instanceof Error ? error : new Error('Failed to load image file');
        setState({
          image: null,
          isLoading: false,
          error: err,
          dimensions: null,
          aspectRatio: null,
        });
        onError?.(err);
      }
    },
    [onLoad, onError, validateDimensions, minWidth, minHeight]
  );

  const reset = useCallback(() => {
    if (state.image?.src?.startsWith('blob:')) {
      URL.revokeObjectURL(state.image.src);
    }
    setState({
      image: null,
      isLoading: false,
      error: null,
      dimensions: null,
      aspectRatio: null,
    });
  }, [state.image]);

  // Load image from URL prop
  useEffect(() => {
    if (url) {
      loadImage(url);
    }
  }, [url, loadImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.image?.src?.startsWith('blob:')) {
        URL.revokeObjectURL(state.image.src);
      }
    };
  }, [state.image]);

  return {
    ...state,
    loadImage,
    loadFile,
    reset,
  };
};