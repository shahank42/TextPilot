FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

# First, copy only the package.json files to leverage Docker caching
COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN bun install

# Copy the rest of the source code
COPY . .

# Build the applications
RUN bun run build

# Prune dev dependencies
RUN rm -rf node_modules
RUN bun install --production

# Use a smaller, production-ready image
FROM oven/bun:1 AS production

# Install dependencies for puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy the pruned dependencies and built applications from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/server/dist ./apps/server/dist
COPY --from=builder /usr/src/app/apps/web/dist ./apps/web/dist
COPY --from=builder /usr/src/app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /usr/src/app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/entrypoint.sh ./

EXPOSE 3000 4173

ENTRYPOINT ["./entrypoint.sh"]
