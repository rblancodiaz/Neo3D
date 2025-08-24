import { useState, useEffect, useCallback } from 'react';
import { imageApi } from '../services/api';

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
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // Validate file
        const isValid = await imageApi.validateImage(file);
        if (!isValid) {
          throw new Error(
            'Invalid image file. Please upload a JPG or PNG image (max 10MB, min 800x600px)'
          );
        }

        // Get dimensions
        const dimensions = await imageApi.getImageDimensions(file);

        // Create object URL and load image
        const url = URL.createObjectURL(file);
        
        const img = new Image();
        img.onload = () => {
          setState({
            image: img,
            isLoading: false,
            error: null,
            dimensions,
            aspectRatio: dimensions.width / dimensions.height,
          });
          onLoad?.(img);
        };

        img.onerror = () => {
          const error = new Error('Failed to load image file');
          setState({
            image: null,
            isLoading: false,
            error,
            dimensions: null,
            aspectRatio: null,
          });
          onError?.(error);
          URL.revokeObjectURL(url);
        };

        img.src = url;
      } catch (error) {
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
    [onLoad, onError]
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