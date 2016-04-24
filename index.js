var phantom = require('phantom');
var uuid = require('uuid');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(express.static(__dirname)); //  "public" off of current is root
app.use(bodyParser.json())
var OSRM = require('osrm')
var transport = {
    bicycle: {
        "0-3": new OSRM("bicycle/Skolevej_0-3.osrm"),
        "4-6": new OSRM("bicycle/Skolevej_4-6.osrm"),
        "7-10": new OSRM("bicycle/Skolevej_7-10.osrm"),
        "all": new OSRM("bicycle/Vejmidte.osrm")
    },
    car: {
        "0-3": new OSRM("car/Skolevej_0-3.osrm"),
        "4-6": new OSRM("car/Skolevej_4-6.osrm"),
        "7-10": new OSRM("car/Skolevej_7-10.osrm"),
        "all": new OSRM("car/Vejmidte.osrm")
    },
    foot: {
        "0-3": new OSRM("foot/Skolevej_0-3.osrm"),
        "4-6": new OSRM("foot/Skolevej_4-6.osrm"),
        "7-10": new OSRM("foot/Skolevej_7-10.osrm"),
        "all": new OSRM("foot/Vejmidte.osrm")
    }
};
phantom.create({
    parameters: {
        'web-security': 'no'
    }
}, function (ph) {
    process.on('exit', function (code, signal) {
        ph.exit();
    });
    app.get('/pdf/:skole/:klasse/:transport/:retning/:lat/:lng', function (req, res) {
        var page;

        try {
            ph.createPage(function (_page) {
                console.log('create page');
                page = _page;
                page.set('onCallback', function (data) {
                    if (data.event === 'load') {
                        var file = uuid.v4() + '.pdf';
                        page.render(file, function () {
                            page.close();
                            page = null;

                            res.download(file, 'ansøgning.pdf', function () {

                                fs.unlink(file);
                            });
                        });
                    }

                });
                page.set('paperSize', {
                    format: 'A4'
                }, function () {
                    // continue with page setup

                    //page.open('https://geo.os2geo.dk/trafik/index.html#/' + req.params.skole + '/' + req.params.klasse + '/' + req.params.transport + '/' + req.params.retning + '/' + req.params.lat + '/' + req.params.lng, function (status) {
                    page.open('http://localhost:5000/print.html#/' + req.params.skole + '/' + req.params.klasse + '/' + req.params.transport + '/' + req.params.retning + '/' + req.params.lat + '/' + req.params.lng, function (status) {


                    });
                });
            });
        } catch (e) {
            try {
                if (page != null) {
                    page.close(); // try close the page in case it opened but never rendered a pdf due to other issues
                }
            } catch (e) {
                // ignore as page may not have been initialised
            }
            res.send('Exception rendering pdf:' + e.toString());
        }

    });
});
app.post('/route/:transport/:age', function (req, res) {    
    //var query = { coordinates: [[56.07569, 12.44687], [56.09377, 12.46238]] };
    req.body.printInstructions = true;
    transport[req.params.transport][req.params.age].route(req.body, function (err, result) {
        if (err) {
            return res.sendStatus(500);
        }
        res.json(result);
    });
});

app.listen(5000);
console.log('Listening on port 5000');
