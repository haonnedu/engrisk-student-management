# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies needed for build)
# Clear npm cache to save space
RUN npm ci --no-optional && npm cache clean --force

# Copy source code
COPY . .

# Build application (Prisma generate happens during build via postinstall or prebuild)
RUN npm run build

# Remove unnecessary files after build to reduce image size
RUN rm -rf node_modules && \
    npm ci --only=production --no-optional && \
    npm cache clean --force

# Generate Prisma client again after reinstalling production deps
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling and openssl for Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/healthcheck.js ./
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Clean up unnecessary files to save space
RUN rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /app/node_modules/.cache

# Make entrypoint executable (before switching user)
USER root
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application with entrypoint that runs migrations first
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
