# --- Stage 1: Build the Angular Phase 0 Studio SPA ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source and config files
COPY . .

# Build the Angular SPA
RUN npm run build

# --- Stage 2: Serve Web UI SPA with Nginx ---
FROM nginx:alpine

# Copy built Angular SPA assets
COPY --from=builder /app/dist/alldare-phase0-ui /usr/share/nginx/html

# Flatten browser subfolder if present and ensure index.html exists
RUN if [ -d /usr/share/nginx/html/browser ]; then cp -rf /usr/share/nginx/html/browser/* /usr/share/nginx/html/; fi && \
    if [ -f /usr/share/nginx/html/index.csr.html ] && [ ! -f /usr/share/nginx/html/index.html ]; then \
        cp /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html; \
    fi

# SPA Routing configuration listening on port 4200 with 404 SPA fallback
RUN echo 'server { \
    listen 4200; \
    port_in_redirect off; \
    root /usr/share/nginx/html; \
    index index.html index.htm index.csr.html; \
    location / { \
        try_files $uri $uri/ /index.html /index.csr.html; \
    } \
    error_page 404 =200 /index.html; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
