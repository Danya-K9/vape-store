FROM node:20-bookworm-slim

WORKDIR /app

# Install root deps + build frontend
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY vite.config.js index.html eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# Install server deps + generate Prisma client
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --no-audit --no-fund --prefix server

COPY server ./server
RUN npm run db:generate --prefix server

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Railway provides DATABASE_URL at runtime
CMD ["sh", "-lc", "cd server && npx prisma db push --schema prisma/schema.prisma && node seed.js && node index.js"]

