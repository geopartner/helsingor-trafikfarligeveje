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
        return (input / 1000).toFixed(2) + ' km';
    } else {
        return input + ' m';
    }
}
var transportIndex = {
    car: 'Bil',
    bycycle: 'Cykel',
    foot: 'Til fods'
};
var retningIndex = {
    0: 'Fra hjem til skole',
    1: 'Fra skole til hjem'
};
var hash = location.hash.split('/');
if (hash.length > 2)
    $('#klasse').val(hash[2] + ' klasse');
if (hash.length > 3)
    $('#transport').val(transportIndex[hash[3]]);
if (hash.length > 4)
    $('#retning').val(retningIndex[hash[4]]);
var url = "https://geo.os2geo.dk/trafik/index.html" + location.hash;
$("#url").attr("href", url).text(url);

var crs = new L.Proj.CRS.TMS('EPSG:25832',
    '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', [120000, 5900000, 1000000, 6500000], {
        resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2]
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

$.getJSON("skoler.geojson", function (data) {
    for (var i = 0; i < data.features.length; i++) {
        var skole = data.features[i];
        if (hash.length > 1 && hash[1] === skole.properties.MSLink.toString()) {
            $('#skoler').val(skole.properties.Tekst);
            if (hash.length > 6 && hash[5] !== '' && hash[6] !== '') {
                $.get('//dawa.aws.dk/adgangsadresser/reverse?x=' + hash[5] + '&y=' + hash[6] + '&srid=4326', function (r) {
                    $('#adresse-autocomplete').val(r.vejstykke.navn + ' ' + r.husnr + ', ' + r.postnummer.nr + ' ' + r.postnummer.navn)
                    $('#tilskudyes').hide();
                    $('#tilskudno').hide();
                    $('#tilskudbtn').hide();
                    var routeOptions = {};
                    if ($('#retning').val() === "0") {
                        routeOptions.coordinates = [
                            [hash[6], hash[5]],
                            [skole.geometry.coordinates[1], skole.geometry.coordinates[0]]
                        ];
                    } else {
                        routeOptions.coordinates = [
                            [skole.geometry.coordinates[1], skole.geometry.coordinates[0]],
                            [hash[6], hash[5]]
                        ];
                    }
                    var klasse = hash[2];
                    var transport = hash[3];
                    $.ajax('route/' + transport + '/' + klasseIndex[klasse].route + '/', {
                        data: JSON.stringify(routeOptions),
                        contentType: 'application/json',
                        type: 'POST'
                    }).done(function (data) {
                        var map = new L.Map('map', {
                            crs: crs,
                            maxZoom: 13
                        }).on('load', function () {
                            var sm = L.marker([skole.geometry.coordinates[1], skole.geometry.coordinates[0]], {
                                icon: L.icon({
                                    iconSize: [36, 90],
                                    popupAnchor: [0, -40],
                                    iconUrl: "pin-l-school+4daf4a.png",
                                    iconRetinaUrl: "pin-l-school+4daf4a@2x.png"
                                })
                            }).addTo(map);
                            L.DomEvent.addListener(sm._icon, 'load', function (e) {
                                var hm = L.marker([hash[6], hash[5]], {
                                    icon: L.icon({
                                        iconSize: [36, 90],
                                        popupAnchor: [0, -40],
                                        iconUrl: "pin-l-building+e41a1c.png",
                                        iconRetinaUrl: "pin-l-building+e41a1c@2x.png"
                                    })
                                }).addTo(map);
                                L.DomEvent.addListener(hm._icon, 'load', function (e) {
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
                                    })

                                    skaermkort.once('load', function (e) {
                                        console.log('load');
                                        if (typeof window.callPhantom === 'function') {
                                            window.callPhantom({ event: 'load' });
                                        }
                                    });
                                    skaermkort.addTo(map);


                                });
                            });
                        });
                        var latlngs = decode(data.route_geometry, 6);
                        var selectedRoute = L.polyline(latlngs, { color: 'red' }).addTo(map);


                        $('#afstand').text(distance(data.route_summary.total_distance));
                        $('#tid').text(data.route_summary.total_time.toHHMMSS());
                        if (data.route_summary.total_distance > klasseIndex[klasse].max) {
                            $('#tilskudyes').show();
                            $('#tilskudbtn').show();
                        } else {
                            $('#tilskudno').show();
                        }
                        map.fitBounds(selectedRoute.getBounds(), { animate: false });
                    });
                });
            }
            break;
        }
    }
});





