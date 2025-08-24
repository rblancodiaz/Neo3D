# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

RUN apk add --no-cache dumb-init curl python3 make g++

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3001 9229

USER node
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Copy node_modules from build stage
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=backend:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R backend:nodejs uploads logs

# Switch to non-root user
USER backend

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["npm", "start"]