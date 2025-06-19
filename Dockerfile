# Dockerfile para Webhooks MCP
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
CMD ["node", "dist/index.js"] 