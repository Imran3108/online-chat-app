FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm ci --omit=dev

COPY src ./src

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]


