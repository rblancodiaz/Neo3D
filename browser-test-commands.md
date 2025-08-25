# Browser Test Commands

Open the browser to: http://localhost:5175

Open Developer Console and run these commands:

## 1. Check available debug functions
```javascript
console.log('Available debug functions:');
console.log('debugHotelUpload:', typeof window.debugHotelUpload);
console.log('debugCurrentState:', typeof window.debugCurrentState);
console.log('testDirectUpload:', typeof window.testDirectUpload);
console.log('testValidation:', typeof window.testValidation);
```

## 2. Test current state
```javascript
window.debugCurrentState();
```

## 3. Test image validation
```javascript
window.testValidation();
```

## 4. Test synthetic hotel upload
```javascript
window.debugHotelUpload();
```

## 5. Create test file input for real file testing
```javascript
function createTestInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.position = 'fixed';
    input.style.top = '10px';
    input.style.right = '10px';
    input.style.zIndex = '999999';
    input.style.background = 'red';
    input.style.color = 'white';
    input.style.padding = '10px';
    input.style.border = '2px solid white';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('Selected file:', file);
            window.testDirectUpload(file);
        }
    };
    document.body.appendChild(input);
    console.log('Test file input created in top-right corner');
}
createTestInput();
```

## Expected Behavior

1. If validation works: You should see logs with "🔥 IMAGE API" prefix showing validation success
2. If handleImageUpload works: You should see logs with "🔥 APP UPLOAD" prefix and a POST request to /api/hotels
3. If everything works: A new hotel should be created and the UI should update

## Debugging the Issue

Watch for these specific log patterns:
- "🔥 IMAGE UPLOADER: Starting handleFile" - File selection working
- "🔥 USE IMAGE LOADER: Starting loadFile validation" - Validation starting  
- "🔥 IMAGE API: validateImage called" - Image API validation
- "🔥 IMAGE API: Dimension check result" - Validation result
- "🔥 USE IMAGE LOADER: Image loaded successfully" - onLoad callback triggered
- "🔥 APP UPLOAD: Starting handleImageUpload" - Final callback reached

If you see the DEBUG direct callback logs, it means the validation is failing but the callback works.