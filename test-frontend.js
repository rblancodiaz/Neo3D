// Simple frontend test script
// This script will test if the fix works

// First, let's create a script that can be run in the browser console to test file upload

const testFrontendUpload = () => {
  console.log('🔥 FRONTEND TEST: Starting frontend upload test...');
  
  // Create a canvas with the exact minimum dimensions (800x600)
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('🔥 FRONTEND TEST: Cannot get canvas context');
    return;
  }
  
  // Create a simple test pattern
  ctx.fillStyle = '#3b82f6';  // Blue background
  ctx.fillRect(0, 0, 800, 600);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FRONTEND TEST', 400, 280);
  ctx.fillText('800 × 600', 400, 320);
  ctx.fillText(new Date().toISOString(), 400, 360);
  
  // Convert to blob and create file
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('🔥 FRONTEND TEST: Cannot create blob');
      return;
    }
    
    const file = new File([blob], 'frontend-test.png', { 
      type: 'image/png',
      lastModified: Date.now()
    });
    
    console.log('🔥 FRONTEND TEST: Created test file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Test if the debug upload function exists
    if (typeof window.testDirectUpload === 'function') {
      console.log('🔥 FRONTEND TEST: Calling window.testDirectUpload...');
      window.testDirectUpload(file);
    } else {
      console.error('🔥 FRONTEND TEST: window.testDirectUpload not available');
      
      // Show available window functions
      console.log('Available window functions:');
      const windowFunctions = Object.keys(window).filter(key => 
        typeof window[key] === 'function' && key.startsWith('debug')
      );
      console.log(windowFunctions);
    }
    
    // Also test validation directly
    if (typeof window.testValidation === 'function') {
      console.log('🔥 FRONTEND TEST: Also testing validation...');
      window.testValidation().then((result) => {
        console.log('🔥 FRONTEND TEST: Validation result:', result);
      });
    }
    
  }, 'image/png');
};

// Test can be called with: testFrontendUpload()
console.log('🔥 FRONTEND TEST: Test function ready - call testFrontendUpload() in the browser console');

// Also create a simple file input for manual testing
const createManualTest = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 999999;
    background: #ef4444;
    color: white;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  `;
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      console.log('🔥 MANUAL TEST: File selected:', file);
      if (window.testDirectUpload) {
        console.log('🔥 MANUAL TEST: Testing upload...');
        window.testDirectUpload(file);
      } else {
        console.error('🔥 MANUAL TEST: testDirectUpload not available');
      }
    }
  };
  
  document.body.appendChild(input);
  console.log('🔥 MANUAL TEST: File input added to page (red button in top-right)');
};

// Export to window
if (typeof window !== 'undefined') {
  window.testFrontendUpload = testFrontendUpload;
  window.createManualTest = createManualTest;
}