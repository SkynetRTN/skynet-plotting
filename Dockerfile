FROM node:17-alpine AS build
WORKDIR /var/build
COPY package.json package-lock.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json vite.config.js ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /var/build/dist /usr/share/nginx/html