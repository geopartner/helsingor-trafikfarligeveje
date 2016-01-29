var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(express.static(__dirname)); //  "public" off of current is root
app.use(bodyParser.json())
var OSRM = require('osrm')
var transport = {
    bycycle: {
        "0-3": new OSRM("bycycle/Skolevej_0-3.osrm"),
        "4-6": new OSRM("bycycle/Skolevej_4-6.osrm"),
        "7-10": new OSRM("bycycle/Skolevej_7-10.osrm")
    },
    car: {
        "0-3": new OSRM("car/Skolevej_0-3.osrm"),
        "4-6": new OSRM("car/Skolevej_4-6.osrm"),
        "7-10": new OSRM("car/Skolevej_7-10.osrm")
    },
    foot: {
        "0-3": new OSRM("foot/Skolevej_0-3.osrm"),
        "4-6": new OSRM("foot/Skolevej_4-6.osrm"),
        "7-10": new OSRM("foot/Skolevej_7-10.osrm")
    }
};

app.post('/:transport/:age', function (req, res) {    
    //var query = { coordinates: [[56.07569, 12.44687], [56.09377, 12.46238]] };
    transport[req.params.transport][req.params.age].route(req.body, function (err, result) {
        if (err) {
            return res.sendStatus(500);
        }
        res.json(result);
    });
});

app.listen(5000);
console.log('Listening on port 5000');