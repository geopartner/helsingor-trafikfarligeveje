FROM ubuntu:xenial

# Create app directory
RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/app/lib
WORKDIR /usr/src/app

# Install app dependencies
RUN apt-get update && apt-get install -y git build-essential python-gdal nodejs nodejs-legacy npm wget
COPY package.json /usr/src/app/
RUN npm install -g bower
RUN npm install

# Bundle app source
COPY . /usr/src/app
RUN bower install --allow-root
RUN git clone --recursive https://github.com/pnorman/ogr2osm ../ogr2osm
RUN make lua
RUN sed -i 's/local safety_penalty            = 1.0/local safety_penalty            = 0.5/g' bicycle.lua
RUN make hsgr


EXPOSE 5000
CMD [ "npm", "start" ]