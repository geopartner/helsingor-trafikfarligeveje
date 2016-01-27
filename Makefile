#http://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets
TOOL_ROOT?=$(shell pwd)/node_modules/osrm/lib/binding
OSRM_DATASTORE:=$(TOOL_ROOT)/osrm-datastore
OSRM_RELEASE:=https://raw.githubusercontent.com/Project-OSRM/osrm-backend/4.9.1
CAR_PROFILE_URL:=$(OSRM_RELEASE)/profiles/car.lua
BYCYCLE_PROFILE_URL:=$(OSRM_RELEASE)/profiles/bicycle.lua
FOOT_PROFILE_URL:=$(OSRM_RELEASE)/profiles/foot.lua
ACCESS_PROFILE_URL:=$(OSRM_RELEASE)/profiles/lib/access.lua
MAXSPEED_PROFILE_URL:=$(OSRM_RELEASE)/profiles/lib/maxspeed.lua
OSRM_EXTRACT:=$(TOOL_ROOT)/osrm-extract
OSRM_PREPARE:=$(TOOL_ROOT)/osrm-prepare
OGR2OSM:=/Users/runetvilum/GitHub/ogr2osm/


lib: clean
	mkdir -p lib

lua: lib
	wget $(ACCESS_PROFILE_URL) -O lib/access.lua
	wget $(MAXSPEED_PROFILE_URL) -O lib/maxspeed.lua
	wget $(CAR_PROFILE_URL) -O car.lua
	wget $(BYCYCLE_PROFILE_URL) -O bycycle.lua
	wget $(FOOT_PROFILE_URL) -O foot.lua 

clean:
	rm -rf lib
	rm -rf bycycle
	rm -rf car
	rm -rf foot    
	rm *.lua

osm:
	$(OGR2OSM)ogr2osm.py -f -t translation.py Skolevej_0-3.geojson
	$(OGR2OSM)ogr2osm.py -f -t translation.py Skolevej_4-6.geojson
	$(OGR2OSM)ogr2osm.py -f -t translation.py Skolevej_7-10.geojson
    
copy: osm
	mkdir -p bycycle
	mkdir -p foot
	mkdir -p car
	cp Skolevej_0-3.osm bycycle/.
	cp Skolevej_0-3.osm foot/.
	cp Skolevej_0-3.osm car/.
	cp Skolevej_4-6.osm bycycle/.
	cp Skolevej_4-6.osm foot/.
	cp Skolevej_4-6.osm car/.
	cp Skolevej_7-10.osm bycycle/.
	cp Skolevej_7-10.osm foot/.
	cp Skolevej_7-10.osm car/.
    
osrm: copy $(OSRM_EXTRACT)
	@echo "Running osrm-extract..."
	$(OSRM_EXTRACT) bycycle/Skolevej_0-3.osm -p bycycle.lua
	$(OSRM_EXTRACT) bycycle/Skolevej_4-6.osm -p bycycle.lua    
	$(OSRM_EXTRACT) bycycle/Skolevej_7-10.osm -p bycycle.lua
	$(OSRM_EXTRACT) car/Skolevej_0-3.osm -p car.lua
	$(OSRM_EXTRACT) car/Skolevej_4-6.osm -p car.lua    
	$(OSRM_EXTRACT) car/Skolevej_7-10.osm -p car.lua
	$(OSRM_EXTRACT) foot/Skolevej_0-3.osm -p foot.lua
	$(OSRM_EXTRACT) foot/Skolevej_4-6.osm -p foot.lua    
	$(OSRM_EXTRACT) foot/Skolevej_7-10.osm -p foot.lua
    
hsgr: osrm $(OSRM_PREPARE)
	@echo "Running osrm-prepare..."
	$(OSRM_PREPARE) bycycle/Skolevej_0-3.osrm -p bycycle.lua
	$(OSRM_PREPARE) bycycle/Skolevej_4-6.osrm -p bycycle.lua
	$(OSRM_PREPARE) bycycle/Skolevej_7-10.osrm -p bycycle.lua
	$(OSRM_PREPARE) car/Skolevej_0-3.osrm -p car.lua
	$(OSRM_PREPARE) car/Skolevej_4-6.osrm -p car.lua
	$(OSRM_PREPARE) car/Skolevej_7-10.osrm -p car.lua
	$(OSRM_PREPARE) foot/Skolevej_0-3.osrm -p foot.lua
	$(OSRM_PREPARE) foot/Skolevej_4-6.osrm -p foot.lua
	$(OSRM_PREPARE) foot/Skolevej_7-10.osrm -p foot.lua
