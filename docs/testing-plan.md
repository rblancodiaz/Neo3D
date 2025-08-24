# Hotel Room Mapper - Testing Plan

## 1. Testing Strategy Overview

### Testing Levels
1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: Component interactions and API endpoints
3. **End-to-End Tests**: Complete user workflows
4. **Performance Tests**: Load times, rendering speed, API response times
5. **Security Tests**: Input validation, authentication, authorization

### Testing Tools
- **Backend**: Jest, Supertest
- **Frontend**: Vitest, React Testing Library
- **E2E**: Playwright/Cypress
- **Performance**: Apache JMeter, Lighthouse
- **Security**: OWASP ZAP, npm audit

## 2. Unit Testing

### Backend Unit Tests

```javascript
// test/controllers/hotelController.test.ts
describe('HotelController', () => {
  describe('createHotel', () => {
    it('should create hotel with valid data', async () => {
      const hotelData = {
        name: 'Test Hotel',
        address: '123 Test St',
        description: 'Test description'
      };
      const result = await createHotel(hotelData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(hotelData.name);
    });

    it('should reject invalid hotel data', async () => {
      const invalidData = { name: '' };
      await expect(createHotel(invalidData)).rejects.toThrow();
    });
  });
});

// test/services/coordinateService.test.ts
describe('CoordinateService', () => {
  describe('normalizeCoordinates', () => {
    it('should normalize pixel coordinates correctly', () => {
      const pixels = { x: 400, y: 300 };
      const dimensions = { width: 800, height: 600 };
      const result = normalizeCoordinates(pixels, dimensions);
      expect(result).toEqual({ x: 0.5, y: 0.5 });
    });

    it('should handle edge cases', () => {
      const pixels = { x: 0, y: 0 };
      const dimensions = { width: 800, height: 600 };
      const result = normalizeCoordinates(pixels, dimensions);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('detectOverlap', () => {
    it('should detect overlapping rectangles', () => {
      const rect1 = { x1: 0.1, y1: 0.1, x2: 0.5, y2: 0.5 };
      const rect2 = { x1: 0.3, y1: 0.3, x2: 0.7, y2: 0.7 };
      expect(detectOverlap(rect1, rect2)).toBe(true);
    });

    it('should not detect non-overlapping rectangles', () => {
      const rect1 = { x1: 0.1, y1: 0.1, x2: 0.3, y2: 0.3 };
      const rect2 = { x1: 0.5, y1: 0.5, x2: 0.7, y2: 0.7 };
      expect(detectOverlap(rect1, rect2)).toBe(false);
    });
  });
});
```

### Frontend Unit Tests

```typescript
// test/components/ImageMapper.test.tsx
describe('ImageMapper Component', () => {
  it('should render canvas with correct dimensions', () => {
    const { container } = render(
      <ImageMapper 
        imageUrl="/test.jpg" 
        width={800} 
        height={600} 
      />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('should handle draw mode toggle', () => {
    const { getByTestId } = render(<ImageMapper />);
    const drawButton = getByTestId('draw-button');
    fireEvent.click(drawButton);
    expect(drawButton).toHaveClass('active');
  });
});

// test/hooks/useCanvasDrawing.test.ts
describe('useCanvasDrawing Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCanvasDrawing());
    expect(result.current.isDrawing).toBe(false);
    expect(result.current.rectangles).toEqual([]);
  });

  it('should handle rectangle creation', () => {
    const { result } = renderHook(() => useCanvasDrawing());
    act(() => {
      result.current.startDrawing({ x: 10, y: 10 });
      result.current.updateDrawing({ x: 100, y: 100 });
      result.current.finishDrawing();
    });
    expect(result.current.rectangles).toHaveLength(1);
    expect(result.current.rectangles[0]).toMatchObject({
      x: 10,
      y: 10,
      width: 90,
      height: 90
    });
  });
});
```

## 3. Integration Testing

### Backend Integration Tests

```javascript
// test/integration/api.test.ts
describe('API Integration Tests', () => {
  let server;
  let db;

  beforeAll(async () => {
    server = await startTestServer();
    db = await connectTestDatabase();
  });

  afterAll(async () => {
    await server.close();
    await db.close();
  });

  describe('Hotel Flow', () => {
    it('should complete hotel creation flow', async () => {
      // 1. Upload image
      const imageResponse = await request(server)
        .post('/api/uploads/image')
        .attach('image', 'test/fixtures/hotel.jpg')
        .expect(200);

      const imageUrl = imageResponse.body.data.url;

      // 2. Create hotel
      const hotelResponse = await request(server)
        .post('/api/hotels')
        .send({
          name: 'Integration Test Hotel',
          address: '123 Test St',
          imageUrl
        })
        .expect(201);

      const hotelId = hotelResponse.body.data.id;

      // 3. Create floor
      const floorResponse = await request(server)
        .post(`/api/hotels/${hotelId}/floors`)
        .send({
          floorNumber: 1,
          name: 'Ground Floor'
        })
        .expect(201);

      const floorId = floorResponse.body.data.id;

      // 4. Create room
      const roomResponse = await request(server)
        .post(`/api/floors/${floorId}/rooms`)
        .send({
          roomNumber: '101',
          roomType: 'standard',
          coordinates: {
            x1: 0.1,
            y1: 0.1,
            x2: 0.3,
            y2: 0.3
          }
        })
        .expect(201);

      expect(roomResponse.body.data).toHaveProperty('id');
    });
  });

  describe('Coordinate Validation', () => {
    it('should reject overlapping rooms', async () => {
      const floorId = 'test-floor-id';
      
      // Create first room
      await request(server)
        .post(`/api/floors/${floorId}/rooms`)
        .send({
          roomNumber: '101',
          coordinates: { x1: 0.1, y1: 0.1, x2: 0.3, y2: 0.3 }
        })
        .expect(201);

      // Try to create overlapping room
      const response = await request(server)
        .post(`/api/floors/${floorId}/rooms`)
        .send({
          roomNumber: '102',
          coordinates: { x1: 0.2, y1: 0.2, x2: 0.4, y2: 0.4 }
        })
        .expect(400);

      expect(response.body.error).toContain('overlap');
    });
  });
});
```

### Frontend-Backend Integration

```typescript
// test/integration/frontend-backend.test.ts
describe('Frontend-Backend Integration', () => {
  it('should sync canvas drawings with backend', async () => {
    // 1. Draw rectangle on canvas
    const rectangle = {
      x: 100,
      y: 100,
      width: 200,
      height: 150
    };

    // 2. Convert to normalized coordinates
    const normalized = normalizeCoordinates(rectangle, {
      width: 800,
      height: 600
    });

    // 3. Send to backend
    const response = await hotelApi.createRoom('floor-id', {
      roomNumber: '201',
      roomType: 'suite',
      coordinates: normalized
    });

    expect(response.data.success).toBe(true);

    // 4. Verify retrieval
    const rooms = await hotelApi.getRooms('floor-id');
    const savedRoom = rooms.data.data.find(r => r.roomNumber === '201');
    
    expect(savedRoom.coordinates).toEqual(normalized);
  });
});
```

## 4. End-to-End Testing

### E2E Test Scenarios

```typescript
// e2e/hotel-mapping.spec.ts
describe('Hotel Room Mapping E2E', () => {
  test('Complete hotel mapping workflow', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('http://localhost:5173');

    // 2. Upload hotel image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/hotel-aerial.jpg');
    
    // Wait for image to load
    await page.waitForSelector('canvas');

    // 3. Enter hotel details
    await page.fill('#hotel-name', 'E2E Test Hotel');
    await page.fill('#hotel-address', '456 E2E Street');
    await page.click('#save-hotel');

    // 4. Switch to drawing mode
    await page.click('#draw-mode-btn');

    // 5. Draw room rectangle
    const canvas = page.locator('canvas');
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 300, y: 250 }
    });

    // 6. Fill room details in popup
    await page.fill('#room-number', '301');
    await page.selectOption('#room-type', 'deluxe');
    await page.click('#save-room');

    // 7. Verify room appears in list
    await expect(page.locator('.room-list')).toContainText('301');

    // 8. Test hover popup
    await canvas.hover({ position: { x: 200, y: 175 } });
    await expect(page.locator('.room-tooltip')).toBeVisible();
    await expect(page.locator('.room-tooltip')).toContainText('Room 301');

    // 9. Save and reload
    await page.reload();
    
    // 10. Verify persistence
    await expect(page.locator('.room-list')).toContainText('301');
    const canvasAfterReload = page.locator('canvas');
    await expect(canvasAfterReload).toBeVisible();
  });

  test('Multi-floor navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/hotel/test-hotel');

    // Add multiple floors
    for (let i = 1; i <= 3; i++) {
      await page.click('#add-floor');
      await page.fill('#floor-name', `Floor ${i}`);
      await page.click('#save-floor');
    }

    // Navigate between floors
    await page.click('[data-floor="2"]');
    await expect(page.locator('.current-floor')).toContainText('Floor 2');

    // Draw rooms on different floors
    await page.click('#draw-mode-btn');
    await drawRoomOnCanvas(page, { x: 50, y: 50, width: 100, height: 80 });

    // Switch floor and verify room isolation
    await page.click('[data-floor="1"]');
    await expect(page.locator('.room-list')).not.toContainText('Room from Floor 2');
  });
});
```

## 5. Performance Testing

### Load Time Tests

```javascript
// performance/load-time.test.js
describe('Performance: Load Times', () => {
  test('Image load time < 2s for 2MB image', async () => {
    const startTime = performance.now();
    await loadImage('/test-images/2mb-hotel.jpg');
    const loadTime = performance.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('API response time < 200ms', async () => {
    const endpoints = [
      '/api/hotels',
      '/api/hotels/1',
      '/api/floors/1/rooms'
    ];

    for (const endpoint of endpoints) {
      const startTime = performance.now();
      await fetch(`http://localhost:3001${endpoint}`);
      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(200);
    }
  });
});
```

### Canvas Performance

```javascript
// performance/canvas.test.js
describe('Performance: Canvas Rendering', () => {
  test('Maintains 60fps during drawing', async () => {
    const fps = await measureCanvasFPS(() => {
      // Simulate drawing operation
      for (let i = 0; i < 100; i++) {
        drawRectangle(canvas, {
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 100,
          height: 80
        });
      }
    });

    expect(fps).toBeGreaterThanOrEqual(60);
  });

  test('Zoom/pan smooth without lag', async () => {
    const frameDrops = await measureFrameDrops(() => {
      // Simulate zoom operations
      for (let zoom = 1; zoom <= 5; zoom += 0.1) {
        canvas.setZoom(zoom);
        canvas.render();
      }
    });

    expect(frameDrops).toBeLessThan(5);
  });
});
```

## 6. Security Testing

### Input Validation Tests

```javascript
// security/validation.test.js
describe('Security: Input Validation', () => {
  test('Rejects SQL injection attempts', async () => {
    const maliciousInputs = [
      "'; DROP TABLE hotels; --",
      "1' OR '1'='1",
      "<script>alert('XSS')</script>"
    ];

    for (const input of maliciousInputs) {
      const response = await request(app)
        .post('/api/hotels')
        .send({ name: input })
        .expect(400);

      expect(response.body.error).toContain('validation');
    }
  });

  test('File upload restrictions', async () => {
    // Test file size limit
    const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await request(app)
      .post('/api/uploads/image')
      .attach('image', largeFile, 'large.jpg')
      .expect(413);

    // Test file type restriction
    await request(app)
      .post('/api/uploads/image')
      .attach('image', 'test/fixtures/document.pdf')
      .expect(400);
  });
});
```

## 7. Test Execution Plan

### Daily Testing (CI/CD)
1. Unit tests on every commit
2. Integration tests on PR
3. Security scans (npm audit)

### Weekly Testing
1. Full E2E test suite
2. Performance benchmarks
3. Cross-browser testing

### Pre-Release Testing
1. Complete test suite execution
2. Load testing (100+ concurrent users)
3. Security penetration testing
4. Accessibility testing
5. Mobile device testing

## 8. Test Coverage Goals

- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: All critical user paths
- **Performance**: Meet all defined targets
- **Security**: Pass OWASP Top 10 checks

## 9. Test Data Management

### Test Database
- Separate test database instance
- Seed data for consistent testing
- Cleanup after each test run

### Test Images
- Set of standard test images
- Various sizes and formats
- Edge cases (corrupted, oversized)

## 10. Continuous Improvement

### Metrics to Track
- Test execution time
- Test flakiness rate
- Bug escape rate
- Code coverage trends

### Review Process
- Weekly test result review
- Monthly test strategy update
- Quarterly test tool evaluation