# Multi-stage Dockerfile for Next.js Web
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY apps/web ./apps/web
COPY packages/types ./packages/types
RUN npm ci
RUN npm run build --workspace=@bharatpredict/web

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
