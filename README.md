# Hotel Room Mapper

Interactive web application for mapping hotel rooms on aerial images with clickable areas and information popups.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15 (if not using Docker)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Neo3D

# Start all services
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3001
# - PostgreSQL: localhost:5432
# - PgAdmin: http://localhost:5050
```

### Local Development Setup

#### 1. Database Setup
```bash
# Start PostgreSQL container
docker-compose up postgres -d

# Run database migrations
cd database
psql -U postgres -h localhost -p 5432 -f 08_create_all.sql
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📋 Project Structure

```
Neo3D/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   └── uploads/      # Image storage
├── frontend/         # React + TypeScript UI
│   ├── src/
│   │   ├── components/
│   │   ├── stores/   # Zustand state management
│   │   ├── hooks/
│   │   └── services/
├── database/         # PostgreSQL schema & migrations
│   ├── schema/
│   ├── functions/
│   ├── triggers/
│   └── seeds/
└── devops/          # Docker & CI/CD configuration
    ├── docker/
    ├── monitoring/
    └── scripts/
```

## 🔑 Core Features

### MVP Features (Implemented)
- ✅ **Image Upload**: Drag & drop with validation (JPG/PNG, max 10MB)
- ✅ **Interactive Canvas**: Draw rectangles to define rooms
- ✅ **Coordinate System**: Normalized coordinates (0-1) for responsive display
- ✅ **Room Management**: CRUD operations with metadata
- ✅ **Hover Popups**: Display room information on hover
- ✅ **Multi-floor Support**: Manage multiple floors per hotel
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Performance Optimized**: 60fps canvas rendering with debouncing

### Technical Features
- **Database**: PostgreSQL with spatial functions for coordinate validation
- **API**: RESTful endpoints with validation and error handling
- **State Management**: Zustand for global state
- **Image Processing**: Sharp for resize and thumbnail generation
- **Security**: Rate limiting, CORS, input validation
- **Monitoring**: Prometheus + Grafana integration ready

## 🛠️ Technology Stack

### Backend
- Node.js + Express + TypeScript
- Sequelize ORM
- Multer (file uploads)
- Sharp (image processing)
- Zod (validation)
- Winston (logging)

### Frontend
- React 18 + TypeScript
- Canvas API (drawing)
- Zustand (state management)
- Tailwind CSS (styling)
- Axios (API client)
- Vite (build tool)

### Database
- PostgreSQL 15
- Spatial functions for geometry
- Triggers for audit trail
- Optimized indexes

### DevOps
- Docker & Docker Compose
- GitHub Actions CI/CD
- Prometheus + Grafana monitoring
- Automated backups

## 📊 API Endpoints

### Hotels
- `GET /api/hotels` - List all hotels
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels` - Create hotel with image
- `PUT /api/hotels/:id` - Update hotel
- `DELETE /api/hotels/:id` - Delete hotel
- `POST /api/hotels/:id/image` - Upload hotel image

### Floors
- `POST /api/hotels/:hotelId/floors` - Create floor
- `PUT /api/floors/:id` - Update floor
- `DELETE /api/floors/:id` - Delete floor

### Rooms
- `GET /api/floors/:floorId/rooms` - List floor rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/floors/:floorId/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `PATCH /api/rooms/:id/coordinates` - Update coordinates

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:coverage

# Frontend tests
cd frontend
npm run test
npm run test:coverage

# E2E tests (requires services running)
npm run test:e2e
```

## 📈 Performance Targets

- ✅ Image load time: <2s for medium images (2MB)
- ✅ Canvas rendering: 60fps with debouncing
- ✅ API response time: <200ms for CRUD operations
- ✅ Coordinate precision: 4 decimal places
- ✅ Mobile responsiveness: Full functionality on 768px+

## 🔒 Security

- Input validation on all endpoints
- File upload restrictions (type, size)
- Rate limiting (100 req/min per IP)
- CORS configuration
- SQL injection prevention via ORM
- XSS protection headers

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/hotel_mapper
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_MAX_UPLOAD_SIZE=10485760
VITE_SUPPORTED_FORMATS=image/jpeg,image/png
```

## 🚢 Deployment

### Production with Docker
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker exec hotel_mapper_api npm run db:migrate

# Check health status
docker-compose ps
```

### Manual Deployment
See [Deployment Guide](./docs/deployment.md) for detailed instructions.

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./database/README.md)
- [Frontend Architecture](./frontend/README.md)
- [DevOps Guide](./devops/README.md)

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check PostgreSQL is running: `docker-compose ps`
   - Verify credentials in .env file
   - Check port 5432 is not in use

2. **Image upload fails**
   - Verify uploads directory exists and has write permissions
   - Check file size limits in environment variables
   - Ensure Sharp dependencies are installed

3. **Canvas not rendering**
   - Check browser console for errors
   - Verify image URL is accessible
   - Test with smaller image first

4. **Coordinates not saving**
   - Check browser DevTools network tab
   - Verify API endpoints are accessible
   - Check database constraints

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 👥 Contributors

- Frontend Team
- Backend Team
- Database Team
- DevOps Team

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ for efficient hotel room management 
