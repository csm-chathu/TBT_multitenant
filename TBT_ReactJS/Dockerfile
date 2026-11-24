FROM node:22-bullseye AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Nginx serve
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist ./

# ADD SPA ROUTING CONFIG
COPY nginx.conf /etc/nginx/conf.d/default.conf