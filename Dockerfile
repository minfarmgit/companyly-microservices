FROM node:16.14
WORKDIR /opt/app
ADD . .
RUN npm install
RUN npm run build
RUN npm prune --production
RUN npm install -g npm-run-all
EXPOSE 3001
EXPOSE 3002
EXPOSE 3004
EXPOSE 3005
EXPOSE 25
EXPOSE 3006
EXPOSE 3007
EXPOSE 3008
CMD ["npm", "start"]
