FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
# Excludes stuff in .dockerignore
COPY . .

EXPOSE 7676

CMD [ "npm", "start" ]
# $ docker build -t sview .
# $ docker run -it --rm --name sview_container sview
