FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Install all dependencies including dev dependencies
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]