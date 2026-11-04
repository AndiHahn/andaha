FROM node:24-alpine AS node
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build:prod

FROM nginx:alpine
COPY --from=node /app/dist/andaha.web-apps.mini-client /usr/share/nginx/html
