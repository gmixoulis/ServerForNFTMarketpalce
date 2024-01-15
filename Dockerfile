FROM node:16.0.0-slim

WORKDIR /usr/src/app

COPY ./api /usr/src/app

RUN yarn

EXPOSE 3000

CMD ["yarn", "start"]