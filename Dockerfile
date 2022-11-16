FROM node:alpine

WORKDIR /app

COPY src/package*.json ./

RUN ls -al

RUN npm install

COPY . .