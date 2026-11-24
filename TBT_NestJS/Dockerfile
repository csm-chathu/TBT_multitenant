# This Dockerfile uses a multi-stage build pattern to create a small, production-ready image.

# ------------------------
# 1. Build Stage
# ------------------------
# Use a robust Node 20 base image for the build environment
FROM node:20-alpine AS builder

# Set the working directory for the application
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for the build step)
RUN npm install

# Copy all source files into the builder environment
COPY . .

# Compile the NestJS project, outputting JavaScript files to the 'dist' folder
RUN npm run build


# ------------------------
# 2. Runtime Stage (Production-Optimized)
# ------------------------
# Use the same lightweight Node 20 base image for the final, lean runtime
FROM node:20-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy package files (needed for npm install)
COPY package*.json ./

# Install ONLY production dependencies, ensuring a small final image size
RUN npm install --omit=dev

# Copy the compiled application code
COPY --from=builder /app/dist ./dist

# Expose the application port (standard for NestJS is 3000)
EXPOSE 3000

# Command to run the compiled application
CMD ["node", "dist/main"]