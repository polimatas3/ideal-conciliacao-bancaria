FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=backend --omit=dev

COPY backend ./backend

WORKDIR /app/backend
EXPOSE 3000

CMD ["npm", "start"]
