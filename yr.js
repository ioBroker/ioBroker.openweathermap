var adapter = require(__dirname + '/../../lib/adapter.js')({

    name:           'yr',

    ready: function () {
        main();
    }

});

var http = 		require('http');
var xml2js = 	require('xml2js');

function main() {

    var tmp = adapter.config.location.split('/');
    var city = unescape(tmp.pop());

    adapter.setObject('yr_forecast', {
        type: 'channel',
        role: 'forecast',
        common: {
            name: 'yr.no forecast ' + city
        },
        native: {
            url: adapter.config.location,
            country: unescape(tmp[0]),
            state: unescape(tmp[1]),
            city: city
        }
    });

    var reqOptions = {
        hostname: 'www.yr.no',
        port: 80,
        path: '/place/' + adapter.config.location + '/forecast.xml',
        method: 'GET'
    };

    adapter.log.info('get http://' + reqOptions.hostname + reqOptions.path);

    var req = http.request(reqOptions, function (res) {

        var data = '';

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function () {
            adapter.log.info('received data from yr.no');
            parseData(data.toString());
        });

    });

    req.on('error', function(e) {
        adapter.log.error(e.message);
    });

    req.end();

    // Force terminate after 5min
    setTimeout(function () {
        adapter.log.error('force terminate');
        process.exit(1);
    }, 300000);

}


function parseData(xml) {

    var options = {
        explicitArray: false,
        mergeAttrs: true
    };
    var parser = new xml2js.Parser(options);
    parser.parseString(xml, function (err, result) {
        if (err) {
            adapter.log.error(err);
        } else {
            adapter.log.info('got weather data from yr.no');
            var forecastArr = result.weatherdata.forecast.tabular.time;

            for (var i = 0; i < forecastArr.length; i++) {
                var period = forecastArr[i];
                period.symbol.url = 'http://symbol.yr.no/grafikk/sym/b38/' + period.symbol.var + '.png';

            }

            var tableDay = '<table style="border-collapse: collapse; padding: 0; margin: 0"><tr class="yr-day">';
            var tableHead = '</tr><tr class="yr-time">';
            var tableMiddle = '</tr><tr class="yr-img">';
            var tableBottom = '</tr><tr class="yr-temp">';
            var dateObj = new Date();
            var dayEnd = dateObj.getFullYear() + '-' + ('0' + (dateObj.getMonth() + 1)).slice(-2) + '-' + ('0' + dateObj.getDate()).slice(-2) + 'T24:00:00';
            var daySwitch = false;
            for (var i = 0; i < 8; i++) {
                var period = forecastArr[i];
                switch (i) {
                    case 0:
                        tableHead += '<td>jetzt</td>';
                        break;
                    default:
                        if (period.from > dayEnd) {
                            if (!daySwitch) {
                                daySwitch = true;
                                tableDay += '<td colspan="'+i+'">Heute</td><td colspan="4">Morgen</td>';
                                if (i < 3) {
                                    tableDay += '<td colspan="' + (4 - i) + '">Übermorgen</td>';
                                }
                                tableHead += '<td>' + parseInt(period.from.substring(11,13),10).toString() + '-' + parseInt(period.to.substring(11,13),10).toString() + '</td>';
                            } else {
                                tableHead += '<td>' + parseInt(period.from.substring(11,13),10).toString() + '-' + parseInt(period.to.substring(11,13),10).toString() + '</td>';
                            }

                        } else {
                            tableHead += '<td>' + parseInt(period.from.substring(11,13),10).toString() + '-' + parseInt(period.to.substring(11,13),10).toString() + '</td>';
                        }
                }

                tableMiddle += '<td><img src="' + period.symbol.url + '" alt="' + period.symbol.name + '" title="' + period.symbol.name + '"><br/>';
                tableBottom += '<td><span class="">'+period.temperature.value+'°C</span></td>';
                //console.log(period);
            }
            var style = '<style type="text/css">tr.yr-day td {font-family: sans-serif; font-size: 9px; padding:0; margin: 0;}\ntr.yr-time td {text-align: center; font-family: sans-serif; font-size: 10px; padding:0; margin: 0;}\ntr.yr-temp td {text-align: center; font-family: sans-serif; font-size: 12px; padding:0; margin: 0;}\ntr.yr-img td {text-align: center; padding:0; margin: 0;}\ntr.yr-time td img {padding:0; margin: 0;}</style>'
            var table = style + tableDay + tableHead + tableMiddle + tableBottom + '</tr></table>';
            //console.log(JSON.stringify(result, null, "  "));

            if (forecastArr[0].precipitation.value != '0' || forecastArr[1].precipitation.value != '1' || forecastArr[2].precipitation.value != '2' || forecastArr[3].precipitation.value != '3') {
                var rain24 = true;
            } else {
                var rain24 = false;
            }
            if (forecastArr[0].precipitation.value != '4' || forecastArr[1].precipitation.value != '5' || forecastArr[2].precipitation.value != '6' || forecastArr[3].precipitation.value != '7') {
                var rain48 = true;
            } else {
                var rain48 = false;
            }

            var minTemp24 = 100;
            var maxTemp24 = -100;
            var minTemp48 = 100;
            var maxTemp48 = -100;
            for (var i = 0; i < 4; i++) {
                if (forecastArr[i].temperature.value > maxTemp24) {
                    maxTemp24 = forecastArr[i].temperature.value;
                }
                if (forecastArr[i].temperature.value < minTemp24) {
                    minTemp24 = forecastArr[i].temperature.value;
                }
                if (forecastArr[i + 4].temperature.value > maxTemp48) {
                    maxTemp48 = forecastArr[i+4].temperature.value;
                }
                if (forecastArr[i + 4].temperature.value < minTemp48) {
                    minTemp48 = forecastArr[i+4].temperature.value;
                }
            }

            adapter.log.info('data succesfully parsed. setting states');

            adapter.setState('rain_24',         {val: rain24, ack: true});
            adapter.setState('rain_48',         {val: rain48, ack: true});
            adapter.setState('temp_min_24',     {val: minTemp24, ack: true});
            adapter.setState('temp_max_24',     {val: maxTemp24, ack: true});
            adapter.setState('temp_min_48',     {val: minTemp48, ack: true});
            adapter.setState('temp_max_48',     {val: maxTemp48, ack: true});
            adapter.setState('forecast_html',   {val: table, ack: true}, function () {
                setTimeout(function () {
                    process.exit(0);
                }, 5000);
            });

        }
    });
}