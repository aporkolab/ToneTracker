# Stage 1: Build the application
FROM node:24-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies exactly as locked
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application from Nginx
FROM nginx:alpine

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the default port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
