# Development stage with hot module replacement
FROM node:18-alpine AS development

# Install dependencies
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001

# Copy package files
COPY --chown=frontend:nodejs package*.json ./

# Install all dependencies
RUN npm ci && npm cache clean --force

# Copy application code
COPY --chown=frontend:nodejs . .

# Switch to non-root user
USER frontend

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with HMR
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]