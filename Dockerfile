FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Run as non-root user for security
RUN addgroup -S nodeuser && adduser -S nodeuser -G nodeuser
USER nodeuser

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
