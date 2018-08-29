FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
# Excludes stuff in .dockerignore
COPY . .

# Create a volume for the cache
VOLUME [ "/usr/src/app/server/cache" ]

EXPOSE 7676

CMD [ "npm", "start" ]
# $ docker build -t sview .
# $ docker run -p 7676:7676 sview
