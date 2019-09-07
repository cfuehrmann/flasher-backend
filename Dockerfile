FROM node:10-alpine
WORKDIR /home/node/app
COPY package.json yarn.lock ./

# Make bcrypt work on Alpine 
RUN apk --no-cache add --virtual builds-deps build-base python

RUN yarn install -p
COPY dist/app .
EXPOSE 4000
CMD node server.js