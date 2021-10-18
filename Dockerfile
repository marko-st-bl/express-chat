FROM node:16.6.2

RUN mkdir /srv/chat && chown node:node /srv/chat

USER node

WORKDIR /srv/chat

COPY --chown=node:node package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]