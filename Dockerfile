# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Set environment to production and install only necessary dependencies
ENV NODE_ENV=production
RUN npm install

# Copy the full app
COPY . .

# Expose port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
