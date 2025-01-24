# Use an official Node.js image as the base
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better cache management
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application
COPY . .

# Run prisma generate to initialize the Prisma client
RUN npx prisma generate

# Expose the app's port
EXPOSE 5453

# Command to start the app
CMD ["npm", "start"]
