# helsingor-trafikfarligeveje


##predecessors
install python (remember python env variable)
npm install

##prompt
launchpad/andre/terminal

## predescessors
## install node.js globally in version 4.4.5
nvm install v4.4.5

## change directory to helsingor-trafikfarligeveje
nvm use v4.4.5
## install ogr2osm
cd ..
git clone --recursive https://github.com/pnorman/ogr2osm
## make osrm definition files
make lua
# bicycle.lua change weighting of cycleroads:  local safety_penalty = 1.0 ændres til 0.5
## create routes depending on categorization:
## bicycle, cars, pedestrians
make hsgr
# run bower installation
npm install -g bower
# install bower dependencies for application
bower install
# test the program
node index.js
http://localhost:5000
# install
git clone <github dir>
service configuration: start node.js service for this specific task
running on port 5000 - use proxy service for redirecting incoming port 80 http calls

# Docker
Installer Docker fra https://store.docker.com/search?type=edition&offering=community

    docker build -t geopartner/helsingor-trafikfarligeveje .
    docker run -p 5000:5000 -d geopartner/helsingor-trafikfarligeveje

Gå til hjemmeside http://localhost:5000

List docker id

    docker ps

Stop docker

    docker stop <id>