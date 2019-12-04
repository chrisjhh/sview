FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY .npmrc ./
RUN npm install

# Bundle app source
# Excludes stuff in .dockerignore
COPY . .

# Create a volume for the cache
VOLUME [ "/usr/src/app/server/cache" ]

EXPOSE 7676

CMD [ "npm", "start" ]
# > docker build -t sview .
# > docker run -p 7676:7676 sview
# or
# > docker container create pgdata
# > docker container create svcache
# > docker run --rm -v pgdata:/var/lib/postgresql/data --name pgdb postgres
# > docker run --rm -p 7676:7676 -v svcache:/usr/src/app/server/cache --link pgdb:postgres --name dev_sview sview
#
# To connect
# > docker run -it --rm --link pgdb:postgres  postgres psql -h postgres -U postgres
