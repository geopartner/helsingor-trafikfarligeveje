var crs = new L.Proj.CRS.TMS('EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', [120000, 5900000, 1000000, 6500000], {
        resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2]
    });
var map = new L.Map('map', {
    crs: crs,
    maxZoom: 13
});

var ortofoto = L.tileLayer('//{s}.services.kortforsyningen.dk/orto_foraar?login=qgisdk&password=qgisdk&request=GetTile&version=1.0.0&service=WMTS&Layer=orto_foraar&style=default&format=image/jpeg&TileMatrixSet=View1&TileMatrix={zoom}&TileRow={y}&TileCol={x}', {
    attribution: 'Geodatastyrelsen',
    continuousWorld: true,

    zoom: function () {
        var zoom = map.getZoom();
        if (zoom < 10)
            return 'L0' + zoom;
        else
            return 'L' + zoom;
    }
});

var skaermkort = L.tileLayer('//{s}.services.kortforsyningen.dk/topo_skaermkort_daempet?login=qgisdk&password=qgisdk&request=GetTile&version=1.0.0&service=WMTS&Layer=dtk_skaermkort_daempet&style=default&format=image/jpeg&TileMatrixSet=View1&TileMatrix={zoom}&TileRow={y}&TileCol={x}', {
    attribution: 'Geodatastyrelsen',
    continuousWorld: true,

    zoom: function () {
        var zoom = map.getZoom();
        if (zoom < 10)
            return 'L0' + zoom;
        else
            return 'L' + zoom;
    }
}).addTo(map);
var skoledistrikter = L.geoJson(null);
$.getJSON('skoledistrikter.geojson', function (data) {
    skoledistrikter.addData(data);
});

var klasseIndex = {
    '0-3': {
        route: '0-3',
        max: 2500
    },
    '4-6': {
        route: '4-6',
        max: 6000
    }
    , '7-9': {
        route: '7-10',
        max: 7000
    }
    , '10': {
        route: '7-10',
        max: 9000
    }

};
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
        return (input / 1000).toFixed(3) + ' km';
    } else {
        return input + ' m';
    }
}
function showRoute(options) {
    setQuery();
    var latlngs = decode(options.data.route_geometry, 6);
    if (selectedRoute) {
        map.removeLayer(selectedRoute);
    }
    selectedRoute = L.polyline(latlngs, { color: 'red' }).addTo(map);
    $('#afstand').text(distance(options.data.route_summary.total_distance));
    $('#tid').text(options.data.route_summary.total_time.toHHMMSS());

    var pointAdresse = selectedAdresse.toGeoJSON();
    var pointSkole = selectedSkole.toGeoJSON();
    var layers = skoledistrikter.getLayers();
    var testDistrik = false;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i].toGeoJSON();
        if (turf.inside(pointAdresse, layer)) {
            if (turf.inside(pointSkole, layer)) {
                testDistrik = true;
            }
            break;
        }
    }
    if (!testDistrik) {
        $('#egetdistrikt').show();
    } else if (options.farlig) {
        $('#farlig').show();
        $('#tilskudbtn').show();
    } else if (options.data.route_summary.total_distance > klasseIndex[options.klasse].max) {
        $('#tilskudyes').show();
        $('#tilskudbtn').show();
    } else {
        $('#tilskudno').show();
    }
    if (options.zoom) {
        map.fitBounds(selectedRoute.getBounds());
    }
}
function route(options) {
    options = options || {};
    options.farlig = false;
    var id_start, id_stop;
    $('#farlig').hide();
    $('#egetdistrikt').hide();
    $('#tilskudyes').hide();
    $('#tilskudno').hide();
    $('#tilskudbtn').hide();
    if (selectedSkole && selectedAdresse) {
        var data1 = {
            coordinates: [
                [selectedAdresse._latlng.lat, selectedAdresse._latlng.lng],
                [selectedSkole._latlng.lat, selectedSkole._latlng.lng]
            ]
        };
        var data2 = {
            coordinates: [
                [selectedSkole._latlng.lat, selectedSkole._latlng.lng],
                [selectedAdresse._latlng.lat, selectedAdresse._latlng.lng]
            ]
        };
        options.klasse = $('#klasse').val();
        var transport = $('#transport').val();
        $.ajax('route/' + transport + '/all', {
            data: JSON.stringify(data1),
            contentType: 'application/json',
            type: 'POST'
        }).done(function (all1) {
            var route = all1.route_instructions[0];
            var farlig = route[1].split('-');
            if (farlig.length === 3) {
                id_start = farlig[0];
                if (farlig[1] === 'T') {
                    if (options.klasse === '0-3' ||
                        (options.klasse === '4-6' && (farlig[2] === '6' || farlig[2] === '60' || farlig[2] === '10')) ||
                        (options.klasse === '7-10' && farlig[2] === '10')) {
                        options.farlig = true;
                    }
                }
            }
            $.ajax('route/' + transport + '/all', {
                data: JSON.stringify(data2),
                contentType: 'application/json',
                type: 'POST'
            }).done(function (all2) {
                var route = all2.route_instructions[0];
                var farlig = route[1].split('-');
                if (farlig.length === 3) {
                    id_stop = farlig[0];
                    if (farlig[1] === 'T') {
                        if (options.klasse === '0-3' ||
                            (options.klasse === '4-6' && (farlig[2] === '6' || farlig[2] === '60' || farlig[2] === '10')) ||
                            (options.klasse === '7-10' && farlig[2] === '10')) {
                            options.farlig = true;
                        }
                    }
                }
                if (options.farlig) {
                    if (options.retning) {
                        if (options.retning === '1') {
                            options.data = all2;
                        } else {
                            options.data = all1;
                        }
                    } else {
                        if (all1.route_summary.total_distance > all2.route_summary.total_distance) {
                            $('#retning').val("0");
                            options.data = all1;
                        } else {
                            $('#retning').val("1");
                            options.data = all2;
                        }
                    }
                    showRoute(options);
                } else {
                    $.ajax('route/' + transport + '/' + klasseIndex[options.klasse].route + '/', {
                        data: JSON.stringify(data1),
                        contentType: 'application/json',
                        type: 'POST'
                    }).done(function (res1) {
                        var route = res1.route_instructions[0];
                        var farlig = route[1].split('-');
                        if (farlig.length === 3 && id_start === farlig[0]) {
                        } else {
                            options.farlig = true;
                        }
                        $.ajax('route/' + transport + '/' + klasseIndex[options.klasse].route + '/', {
                            data: JSON.stringify(data2),
                            contentType: 'application/json',
                            type: 'POST'
                        }).done(function (res2) {
                            var route = res2.route_instructions[0];
                            var farlig = route[1].split('-');
                            if (farlig.length === 3 && id_stop === farlig[0]) {
                            } else {
                                options.farlig = true;
                            }
                            if (options.farlig) {
                                if (options.retning) {
                                    if (options.retning === '1') {
                                        options.data = all2;
                                    } else {
                                        options.data = all1;
                                    }
                                } else {
                                    if (all1.route_summary.total_distance > all2.route_summary.total_distance) {
                                        $('#retning').val("0");
                                        options.data = all1;
                                    } else {
                                        $('#retning').val("1");
                                        options.data = all2;
                                    }
                                }
                            } else {
                                if (options.retning) {
                                    if (options.retning === '1') {
                                        options.data = res2;
                                    } else {
                                        options.data = res1;
                                    }
                                } else {
                                    if (res1.route_summary.total_distance > res2.route_summary.total_distance) {
                                        $('#retning').val("0");
                                        options.data = res1;
                                    } else {
                                        $('#retning').val("1");
                                        options.data = res2;
                                    }
                                }
                            }
                            showRoute(options);
                        });
                    });
                }
            });
        });
    }
}
function setAdresse(latlng, tekst) {
    if (selectedAdresse) {
        map.removeLayer(selectedAdresse);
    }
    //selectedAdresse = L.marker(latlng, { icon: iconHome, draggable: true }).addTo(map);
    selectedAdresse = L.marker(latlng, { icon: iconHome }).addTo(map);
    selectedAdresse.bindPopup(tekst);
    selectedAdresse.openPopup();
    selectedAdresse.on('drag', function (e) {
        route();
    });
    selectedAdresse.on('dragend', function (e) {
        $.get('//dawa.aws.dk/adgangsadresser/reverse?x=' + e.target._latlng.lng + '&y=' + e.target._latlng.lat + '&srid=4326', function (r) {
            var popup = e.target.getPopup();
            popup.setContent(r.vejstykke.navn + ' ' + r.husnr + ', ' + r.postnummer.nr + ' ' + r.postnummer.navn);
            $('#adresse-autocomplete').val(r.vejstykke.navn + ' ' + r.husnr + ', ' + r.postnummer.nr + ' ' + r.postnummer.navn)
            e.target.openPopup();
        })
    });

}
function setQuery() {
    var skole = $('#skoler').val();
    if (skole !== '-1') {
        skole = skoler.getLayer(skole).feature.properties.MSLink;
    }
    var lng = '';
    var lat = '';
    if (selectedAdresse) {
        lat = selectedAdresse._latlng.lat;
        lng = selectedAdresse._latlng.lng;
    }
    var hash = "/" + [
        skole,
        $('#klasse').val(),
        $('#transport').val(),
        $('#retning').val(),
        lng,
        lat
    ].join("/");
    location.replace('#' + hash);
    $("#tilskudbtn").attr("href", "pdf" + hash);
}
var hash = location.hash.split('/');
if (hash.length > 2)
    $('#klasse').val(hash[2]);
if (hash.length > 3)
    $('#transport').val(hash[3]);
if (hash.length > 4)
    $('#retning').val(hash[4]);
if (hash.length > 6 && hash[5] !== '' && hash[6] !== '') {
    $.get('//dawa.aws.dk/adgangsadresser/reverse?x=' + hash[5] + '&y=' + hash[6] + '&srid=4326', function (r) {
        setAdresse([hash[6], hash[5]], r.vejstykke.navn + ' ' + r.husnr + ', ' + r.postnummer.nr + ' ' + r.postnummer.navn);
        $('#adresse-autocomplete').val(r.vejstykke.navn + ' ' + r.husnr + ', ' + r.postnummer.nr + ' ' + r.postnummer.navn)
        route({ zoom: true });
    })
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
$('#retning').on('change', function () {
    route({ retning: $('#retning').val() });
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
    if (hash.length > 1 && hash[1] === e.layer.feature.properties.MSLink.toString()) {
        $('#skoler').val(e.layer._leaflet_id);
        selectSkole(e.layer);
    }
})

var baselayers = {
    "Topografisk kort": skaermkort,
    "Flyfoto": ortofoto
};

var overlays = {
    // "Skoler": skoler
    "Skoledistrikter": skoledistrikter
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
        $.get('//dawa.aws.dk/adgangsadresser/' + data.data.id, function (punkt) {
            var latlng = [punkt.adgangspunkt.koordinater[1], punkt.adgangspunkt.koordinater[0]];
            setAdresse(latlng, data.tekst);
            route();
        });
    },
    error: function (xhr, status, error) {
        alert('Der opstod en fejl: ' + status + " - " + error);
    }
});
$("#tilskudbtn").click(
    function (e) {
        e.preventDefault();

        //open download link in new page
        window.open($(this).attr("href"));

        //redirect current page to success page
        window.location = "https://link.oib.dk/kommune.asp?kommunekode=217&blanketid=1205";
        window.focus();
    }
);
