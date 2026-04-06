# Use Node 20 as base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your backend runs on
EXPOSE 5000

# Start the server using node
CMD ["node", "src/server.js"]
