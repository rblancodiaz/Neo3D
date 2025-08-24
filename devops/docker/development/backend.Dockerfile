# Development stage for hot reload
FROM node:18-alpine AS development

# Install dependencies for development
RUN apk add --no-cache \
    dumb-init \
    curl \
    python3 \
    make \
    g++

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy package files
COPY --chown=backend:nodejs package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci && npm cache clean --force

# Copy application code
COPY --chown=backend:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R backend:nodejs uploads logs

# Switch to non-root user
USER backend

# Expose ports
EXPOSE 3001 9229

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start with nodemon for hot reload
CMD ["npm", "run", "dev"]