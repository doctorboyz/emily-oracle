# psi-reader — reader (web app + API)
# Built standalone from reader/ (not the monorepo workspaces).
FROM node:20-alpine

# better-sqlite3 native build needs python3/make/g++; openssl for any crypto; tzdata for Asia/Bangkok
RUN apk add --no-cache python3 make g++ openssl tzdata

ENV TZ=Asia/Bangkok
WORKDIR /app

# Install deps first (cache layer)
COPY package.json ./
RUN npm install

# Copy sources and build the frontend
COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY server ./server
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run the API + static SPA server
CMD ["npx", "tsx", "server/index.ts"]