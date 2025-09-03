# ========== Base (shared) ==========
FROM node:20-alpine AS base
WORKDIR /app
# If you use native addons, you may need build deps:
# RUN apk add --no-cache python3 make g++ 
COPY package*.json ./

# ========== Dev (hot reload) ==========
FROM base AS dev
# Installs ALL deps incl. devDeps for hot-reload
RUN npm install
COPY . .
ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000
# Use nodemon or node --watch; pick one you actually have in package.json
CMD ["npm", "run", "dev"]
# e.g. "dev": "nodemon src/server.js"  (or)  "dev": "node --watch src/server.js"

# ========== Prod deps ==========
FROM base AS prod-deps
# Installs ONLY production deps (faster, smaller)
RUN npm ci --omit=dev

# ========== Prod (runtime) ==========
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
# e.g. "start": "node src/server.js"
