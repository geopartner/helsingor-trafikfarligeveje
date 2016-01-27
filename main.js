var crs = new L.Proj.CRS.TMS('EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', [120000, 5900000, 1000000, 6500000], {
        resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2, 0.1]
    });
var map = new L.Map('map', {
    crs: crs
});

var ortofoto = L.tileLayer('http://{s}.services.kortforsyningen.dk/orto_foraar?login=qgisdk&password=qgisdk&request=GetTile&version=1.0.0&service=WMTS&Layer=orto_foraar&style=default&format=image/jpeg&TileMatrixSet=View1&TileMatrix={zoom}&TileRow={y}&TileCol={x}', {
    attribution: 'Geodatastyrelsen',
    continuousWorld: true,
    maxZoom: 14,
    zoom: function () {
        var zoom = map.getZoom();
        if (zoom < 10)
            return 'L0' + zoom;
        else
            return 'L' + zoom;
    }
});

var skaermkort = L.tileLayer('http://{s}.services.kortforsyningen.dk/topo_skaermkort_daempet?login=qgisdk&password=qgisdk&request=GetTile&version=1.0.0&service=WMTS&Layer=dtk_skaermkort_daempet&style=default&format=image/jpeg&TileMatrixSet=View1&TileMatrix={zoom}&TileRow={y}&TileCol={x}', {
    attribution: 'Geodatastyrelsen',
    continuousWorld: true,
    maxZoom: 14,
    zoom: function () {
        var zoom = map.getZoom();
        if (zoom < 10)
            return 'L0' + zoom;
        else
            return 'L' + zoom;
    }
}).addTo(map);
var selectedSkole, selectedAdresse, selectedRoute;
var icon = L.MakiMarkers.icon({ icon: "school", color: "#377eb8", size: "m" });
var iconSelected = L.MakiMarkers.icon({ icon: "school", color: "#4daf4a", size: "l" });
var iconHome = L.MakiMarkers.icon({ icon: "building", color: "#e41a1c", size: "l" });

function deselectSkole() {
    if (selectedSkole) {
        selectedSkole.setIcon(icon);
        selectedSkole.closePopup();
    }
    selectedSkole = null;
}
function selectSkole(layer, open) {
    deselectSkole();
    selectedSkole = layer;
    selectedSkole.setIcon(iconSelected);
    if (open) {
        selectedSkole.openPopup();
    }
    route();
}
Number.prototype.toHHMMSS = function () {
    var seconds = Math.floor(this),
        hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
};

function decode(encoded, precision) {
    precision = Math.pow(10, -precision);
    var len = encoded.length,
        index = 0,
        lat = 0,
        lng = 0,
        array = [];
    while (index < len) {
        var b, shift = 0,
            result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        //array.push( {lat: lat * precision, lng: lng * precision} );
        array.push([lat * precision, lng * precision]);
    }
    return array;
}
function distance(input) {
    if (input >= 1000) {
        return (input/1000).toFixed(2) + ' km';
    } else {
        return input + ' m';
    }
}
function route() {
    if (selectedSkole && selectedAdresse) {
        var data = {
            coordinates: [
                [selectedSkole._latlng.lat, selectedSkole._latlng.lng],
                [selectedAdresse._latlng.lat, selectedAdresse._latlng.lng]
            ]
        };
        var klasse = $('#klasse').val();
        var transport = $('#transport').val();
        $.ajax(transport+'/'+klasse+'/', {
            data: JSON.stringify(data),
            contentType: 'application/json',
            type: 'POST'
        }).done(function (data) {
            console.log(data);
            var latlngs = decode(data.route_geometry,6);
            if (selectedRoute) {
                map.removeLayer(selectedRoute);
            }
            selectedRoute = L.polyline(latlngs, {color: 'red'}).addTo(map);
            $('#afstand').text(distance(data.route_summary.total_distance));
            $('#tid').text(data.route_summary.total_time.toHHMMSS());
        });
    }
}

$('#skoler').on('change', function () {
    if (this.value === '-1') {
        deselectSkole();
    } else {
        selectSkole(skoler.getLayer(this.value), true);
    }
});

$('#klasse').on('change', function () {
    route();
});
$('#transport').on('change', function () {
    route();
});

var skoler = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: icon }).on('click', function (e) {
            $('#skoler').val(e.target._leaflet_id);
            selectSkole(e.target, false);
        });
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.Tekst);
    }
}).addTo(map);

skoler.on('layeradd', function (e) {
    $('#skoler').append('<option value=' + e.layer._leaflet_id + '>' + e.layer.feature.properties.Tekst + '</option>');
})

var baselayers = {
    "Topografisk kort": skaermkort,
    "Flyfoto": ortofoto
};

var overlays = {
   // "Skoler": skoler
};

L.control.layers(baselayers, overlays).addTo(map);

$.getJSON("skoler.geojson", function (data) {
    skoler.addData(data);
    map.fitBounds(skoler.getBounds());
});


var layerHome;
$('#adresse-autocomplete').dawaautocomplete({
    adgangsadresserOnly: true,
    params: {
        kommunekode: '0217'
    },
    select: function (event, data) {
        $.get(data.data.href, function (punkt) {
            if (selectedAdresse) {
                map.removeLayer(selectedAdresse);
            }
            selectedAdresse = L.marker([punkt.adgangspunkt.koordinater[1], punkt.adgangspunkt.koordinater[0]], { icon: iconHome, draggable:true }).addTo(map);
            selectedAdresse.bindPopup(data.tekst);
            selectedAdresse.openPopup();
            selectedAdresse.on('drag',function(e){
                route();
            })
            route();
        });
    },
    error: function (xhr, status, error) {
        alert('Der opstod en fejl: ' + status + " - " + error);
    }
});
