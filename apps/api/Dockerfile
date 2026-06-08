# Multi-stage Dockerfile for NestJS API
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY apps/api ./apps/api
COPY packages/types ./packages/types
RUN npm ci
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=@bharatpredict/api

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
EXPOSE 4050
ENV NODE_ENV=production
CMD ["node", "dist/src/main.js"]
