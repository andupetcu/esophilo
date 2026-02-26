FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy Next.js standalone output
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy seed scripts + source data + deps for seeding
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/sources.csv ./sources.csv
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Install tsx for running TypeScript seed scripts
RUN npm install -g tsx

# Startup script: seed DB if needed, then start server
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 3000
CMD ["./start.sh"]
