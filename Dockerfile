FROM node:22-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Run bot
CMD ["node", "src/index.js"]
