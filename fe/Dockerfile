# Multi-stage Dockerfile for Next.js app

FROM node:18-alpine AS frontend-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:18-alpine AS frontend-runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]