FROM node:10-alpine
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install -p
COPY dist/app .
CMD node server.js