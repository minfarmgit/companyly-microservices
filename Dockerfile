FROM node:16-alpine
WORKDIR /opt/app
ADD package.json package.json
RUN npm install
ADD . .
RUN npm run build
RUN npm prune --production
EXPOSE 3001
EXPOSE 3002
EXPOSE 3004
EXPOSE 3005
EXPOSE 25
EXPOSE 3006
EXPOSE 3007
EXPOSE 3008
CMD ["npm", "start"]
