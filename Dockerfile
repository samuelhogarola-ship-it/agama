# Stage 1: build the static AGAMA website
FROM node:20-alpine AS site-builder
WORKDIR /app
COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: build the colour configurator as a Next.js standalone app
FROM node:20-alpine AS configurator-builder
WORKDIR /app/apps/configurador
COPY apps/configurador/package*.json ./
RUN npm ci
COPY apps/configurador ./
RUN npm run build

# Stage 3: serve the static site and proxy /configurador to the Next runtime
FROM node:20-alpine
RUN apk add --no-cache nginx && mkdir -p /run/nginx

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV CONFIGURATOR_PORT=3000

COPY --from=site-builder /app/dist /usr/share/nginx/html
COPY --from=configurator-builder /app/apps/configurador/.next/standalone /app/apps/configurador/.next/standalone
COPY --from=configurator-builder /app/apps/configurador/.next/static /app/apps/configurador/.next/standalone/.next/static
COPY --from=configurator-builder /app/apps/configurador/public /app/apps/configurador/.next/standalone/public
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY scripts/start-agama-container.sh /usr/local/bin/start-agama-container.sh

RUN chmod +x /usr/local/bin/start-agama-container.sh

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["/usr/local/bin/start-agama-container.sh"]
