#http://www.gnu.org/prep/standards/html_node/Standard-Targets.html#Standard-Targets
TOOL_ROOT?=$(shell pwd)/node_modules/osrm/lib/binding
OSRM_DATASTORE:=$(TOOL_ROOT)/osrm-datastore
OSRM_RELEASE:=https://raw.githubusercontent.com/Project-OSRM/osrm-backend/c27fc4e4d80ddc24c7cb0d22237a49ce88c814e4
CAR_PROFILE_URL:=$(OSRM_RELEASE)/profiles/car.lua
bicycle_PROFILE_URL:=$(OSRM_RELEASE)/profiles/bicycle.lua
FOOT_PROFILE_URL:=$(OSRM_RELEASE)/profiles/foot.lua
ACCESS_PROFILE_URL:=$(OSRM_RELEASE)/profiles/lib/access.lua
MAXSPEED_PROFILE_URL:=$(OSRM_RELEASE)/profiles/lib/maxspeed.lua
OSRM_EXTRACT:=$(TOOL_ROOT)/osrm-extract
OSRM_PREPARE:=$(TOOL_ROOT)/osrm-prepare
OGR2OSM:=../ogr2osm/


lib: clean
	mkdir -p lib

lua: 
	wget $(ACCESS_PROFILE_URL) -O lib/access.lua
	wget $(MAXSPEED_PROFILE_URL) -O lib/maxspeed.lua
	wget $(CAR_PROFILE_URL) -O car.lua
	wget $(bicycle_PROFILE_URL) -O bicycle.lua
	wget $(FOOT_PROFILE_URL) -O foot.lua 

clean:
	rm -rf lib
	rm -rf bicycle
	rm -rf car
	rm -rf foot    
	rm *.lua

osm:
	$(OGR2OSM)ogr2osm.py -f -t translation_0-3.py -o Skolevej_0-3.osm Vejmidte.geojson
	$(OGR2OSM)ogr2osm.py -f -t translation_4-6.py -o Skolevej_4-6.osm Vejmidte.geojson
	$(OGR2OSM)ogr2osm.py -f -t translation_7-10.py -o Skolevej_7-10.osm Vejmidte.geojson
	$(OGR2OSM)ogr2osm.py -f -t translation_vej.py -o Vejmidte.osm Vejmidte.geojson
    
copy: osm
	mkdir -p bicycle
	mkdir -p foot
	mkdir -p car
	cp Skolevej_0-3.osm bicycle/.
	cp Skolevej_0-3.osm foot/.
	cp Skolevej_0-3.osm car/.
	cp Skolevej_4-6.osm bicycle/.
	cp Skolevej_4-6.osm foot/.
	cp Skolevej_4-6.osm car/.
	cp Skolevej_7-10.osm bicycle/.
	cp Skolevej_7-10.osm foot/.
	cp Skolevej_7-10.osm car/.
	cp Vejmidte.osm bicycle/.
	cp Vejmidte.osm foot/.
	cp Vejmidte.osm car/.
    
osrm: copy $(OSRM_EXTRACT)
	@echo "Running osrm-extract..."
	$(OSRM_EXTRACT) bicycle/Skolevej_0-3.osm -p bicycle.lua
	$(OSRM_EXTRACT) bicycle/Skolevej_4-6.osm -p bicycle.lua    
	$(OSRM_EXTRACT) bicycle/Skolevej_7-10.osm -p bicycle.lua
	$(OSRM_EXTRACT) bicycle/Vejmidte.osm -p bicycle.lua
	$(OSRM_EXTRACT) car/Skolevej_0-3.osm -p car.lua
	$(OSRM_EXTRACT) car/Skolevej_4-6.osm -p car.lua    
	$(OSRM_EXTRACT) car/Skolevej_7-10.osm -p car.lua
	$(OSRM_EXTRACT) car/Vejmidte.osm -p car.lua
	$(OSRM_EXTRACT) foot/Skolevej_0-3.osm -p foot.lua
	$(OSRM_EXTRACT) foot/Skolevej_4-6.osm -p foot.lua    
	$(OSRM_EXTRACT) foot/Skolevej_7-10.osm -p foot.lua
	$(OSRM_EXTRACT) foot/Vejmidte.osm -p foot.lua
    
hsgr: osrm $(OSRM_PREPARE)
	@echo "Running osrm-prepare..."
	$(OSRM_PREPARE) bicycle/Skolevej_0-3.osrm -p bicycle.lua
	$(OSRM_PREPARE) bicycle/Skolevej_4-6.osrm -p bicycle.lua
	$(OSRM_PREPARE) bicycle/Skolevej_7-10.osrm -p bicycle.lua
	$(OSRM_PREPARE) bicycle/Vejmidte.osrm -p bicycle.lua
	$(OSRM_PREPARE) car/Skolevej_0-3.osrm -p car.lua
	$(OSRM_PREPARE) car/Skolevej_4-6.osrm -p car.lua
	$(OSRM_PREPARE) car/Skolevej_7-10.osrm -p car.lua
	$(OSRM_PREPARE) car/Vejmidte.osrm -p car.lua
	$(OSRM_PREPARE) foot/Skolevej_0-3.osrm -p foot.lua
	$(OSRM_PREPARE) foot/Skolevej_4-6.osrm -p foot.lua
	$(OSRM_PREPARE) foot/Skolevej_7-10.osrm -p foot.lua
	$(OSRM_PREPARE) foot/Vejmidte.osrm -p foot.lua
	
	
test: 
#	$(OGR2OSM)ogr2osm.py -f -t translation_0-3.py -o Skolevej_0-3.osm Vejmidte.geojson
	cp Skolevej_0-3.osm bicycle/.
	$(OSRM_EXTRACT) bicycle/Skolevej_0-3.osm -p bicycle.lua
	$(OSRM_PREPARE) bicycle/Skolevej_0-3.osrm -p bicycle.lua
