FROM node:8-alpine

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV=production

COPY package.json .

RUN npm install --production

COPY . .

CMD ["npm", "start"]
