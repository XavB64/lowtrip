FROM node:lts

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

ENV REACT_APP_API_URL=http://localhost:8000

COPY . /app/