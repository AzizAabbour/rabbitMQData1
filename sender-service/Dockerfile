# ── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production image ─────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
