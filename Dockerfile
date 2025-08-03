FROM node:18-alpine

# Install Chrome for testing
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install testing dependencies
RUN npm install --save-dev \
    puppeteer \
    jest \
    jsdom \
    @testing-library/jest-dom \
    playwright \
    lighthouse \
    axe-core

# Copy app source
COPY . .

# Create test results directory
RUN mkdir -p test-results

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1

# Default command
CMD ["npm", "start"]
