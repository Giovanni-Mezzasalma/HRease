FROM node:20-alpine

# Set working directory
WORKDIR /app

# Add package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose port
EXPOSE 3000

# Start the service in development mode (not production)
CMD ["npm", "start"]