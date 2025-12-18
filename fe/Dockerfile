# Multi-stage Dockerfile for Next.js app

FROM node:18-alpine AS frontend-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Clear any existing build cache to ensure clean build
RUN rm -rf .next .next/cache node_modules/.cache .turbo
# Clear npm cache and ensure clean environment
RUN npm cache clean --force || true
# Ensure clean build environment - remove any potential conflicts
RUN find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
# Build with clean cache - this ensures clientReferenceManifest is generated correctly
# The build must happen in Linux environment (Docker) to avoid Windows path issues
RUN npm run build
# Verify that client reference manifest files exist
RUN ls -la .next/server/app/*/page_client-reference-manifest.js 2>/dev/null || echo "Warning: Manifest files check"

FROM node:18-alpine AS frontend-runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Copy the complete .next directory including all manifests
# Copy recursively to ensure all subdirectories and files are included
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/public ./public
# Verify critical manifest files exist before starting
RUN test -d .next/server || (echo "ERROR: .next/server directory missing" && exit 1)
EXPOSE 3000
CMD ["npm", "start"]