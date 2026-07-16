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
FROM nginx:alpine
RUN apk add --no-cache nodejs

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=site-builder /app/dist /usr/share/nginx/html
COPY --from=configurator-builder /app/apps/configurador/.next/standalone /app/apps/configurador/.next/standalone
COPY --from=configurator-builder /app/apps/configurador/.next/static /app/apps/configurador/.next/standalone/.next/static
COPY --from=configurator-builder /app/apps/configurador/public /app/apps/configurador/.next/standalone/public
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/start-agama-container.sh /usr/local/bin/start-agama-container.sh

RUN chmod +x /usr/local/bin/start-agama-container.sh

EXPOSE 80
CMD ["/usr/local/bin/start-agama-container.sh"]
