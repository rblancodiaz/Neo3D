// Simple test script to check image upload functionality
// Run this in the browser console at http://localhost:5175

console.log('🔥 UPLOAD TEST: Starting comprehensive upload test...');

// Test 1: Check if debug functions are available
console.log('🔥 TEST 1: Checking debug functions availability...');
console.log('debugHotelUpload available:', typeof window.debugHotelUpload === 'function');
console.log('debugCurrentState available:', typeof window.debugCurrentState === 'function');
console.log('testDirectUpload available:', typeof window.testDirectUpload === 'function');

// Test 2: Check current state
console.log('🔥 TEST 2: Checking current state...');
if (window.debugCurrentState) {
  window.debugCurrentState();
}

// Test 3: Run synthetic upload test
console.log('🔥 TEST 3: Running synthetic upload test...');
if (window.debugHotelUpload) {
  window.debugHotelUpload().then((result) => {
    console.log('🔥 TEST 3 RESULT:', result);
  }).catch((error) => {
    console.error('🔥 TEST 3 ERROR:', error);
  });
} else {
  console.error('🔥 TEST 3 ERROR: debugHotelUpload function not available');
}

// Test 4: Create a file input to test real file selection
console.log('🔥 TEST 4: Creating file input for manual testing...');
function createFileInput() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.position = 'fixed';
  fileInput.style.top = '10px';
  fileInput.style.left = '10px';
  fileInput.style.zIndex = '10000';
  fileInput.style.background = 'red';
  fileInput.style.color = 'white';
  
  fileInput.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      console.log('🔥 REAL FILE TEST: File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      });
      
      if (window.testDirectUpload) {
        console.log('🔥 REAL FILE TEST: Calling testDirectUpload...');
        window.testDirectUpload(file);
      } else {
        console.error('🔥 REAL FILE TEST ERROR: testDirectUpload not available');
      }
    }
  };
  
  document.body.appendChild(fileInput);
  console.log('🔥 TEST 4: File input created - you can now select a real file to test');
  
  return fileInput;
}

window.createTestFileInput = createFileInput;
console.log('🔥 UPLOAD TEST: Run window.createTestFileInput() to create a file input for manual testing');