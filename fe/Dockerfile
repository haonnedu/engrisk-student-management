# Multi-stage Dockerfile for Next.js app with standalone output

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
# Ensure clean build environment
RUN find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
# Build with clean cache - standalone mode
RUN npm run build
# Verify build output
RUN ls -la .next/ && ls -la .next/standalone/ 2>/dev/null || echo "Checking build output..."

FROM node:18-alpine AS frontend-runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files for standalone mode
COPY --from=frontend-builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Use standalone server instead of npm start for better performance
CMD ["node", "server.js"]
