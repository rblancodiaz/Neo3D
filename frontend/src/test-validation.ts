// Test file to debug validation issues
// This is a temporary file for debugging

export const testValidation = async () => {
  console.log('🔥 VALIDATION TEST: Starting validation test...');
  
  // Create a canvas with 800x600 image (minimum requirement)
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('🔥 VALIDATION TEST: Failed to get canvas context');
    return;
  }
  
  // Fill with a simple pattern
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Test Hotel Image', 400, 300);
  
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('🔥 VALIDATION TEST: Failed to create blob');
        resolve(false);
        return;
      }
      
      const file = new File([blob], 'test-hotel.png', { type: 'image/png' });
      
      console.log('🔥 VALIDATION TEST: Created test file:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      
      // Import imageApi dynamically
      try {
        const { imageApi } = await import('./services/api');
        
        console.log('🔥 VALIDATION TEST: Calling imageApi.validateImage...');
        const isValid = await imageApi.validateImage(file);
        console.log('🔥 VALIDATION TEST: Validation result:', isValid);
        
        if (isValid) {
          console.log('🔥 VALIDATION TEST: Getting image dimensions...');
          const dimensions = await imageApi.getImageDimensions(file);
          console.log('🔥 VALIDATION TEST: Dimensions:', dimensions);
        }
        
        resolve(isValid);
      } catch (error) {
        console.error('🔥 VALIDATION TEST: Error during validation:', error);
        resolve(false);
      }
    }, 'image/png');
  });
};

// Add to window for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testValidation = testValidation;
}