# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Use Docker-specific config for static build
RUN cp svelte.config.docker.js svelte.config.js

# Disable SSR and enable prerender for static build
# Remove existing prerender/ssr exports and add new ones
RUN sed -i '/^export const \(ssr\|prerender\)/d' src/routes/+layout.ts && \
    echo "export const ssr = false;" >> src/routes/+layout.ts && \
    echo "export const prerender = true;" >> src/routes/+layout.ts && \
    find src/routes -name "+page.ts" -type f -exec sh -c 'sed -i "/^export const \(ssr\|prerender\)/d" "$1" && echo "export const ssr = false;" >> "$1" && echo "export const prerender = true;" >> "$1"' _ {} \;

# Sync SvelteKit and build
ENV NODE_ENV=production
RUN pnpm prepare && pnpm build

# Verify build output
RUN ls -la build/ && \
    find build -maxdepth 2 -type f | head -20

# Stage 2: Production with nginx
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=builder /app/build /usr/share/nginx/html

# Create nginx config file
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle _app directory (SvelteKit assets) - must come before other locations
    location /_app {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SvelteKit data endpoints - must match before other routes
    # This handles /__data.json and /app/__data.json etc.
    location ~ ^(.*)/__data\.json$ {
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
        # Try to serve the actual file if it exists
        try_files $uri @empty_json;
    }
    
    location @empty_json {
        add_header Content-Type application/json;
        return 200 "{}";
    }

    # Handle app route
    location /app {
        try_files /app.html /index.html;
    }

    # SPA routing - fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
