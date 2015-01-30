var http = 	 require('http');
var xml2js = require('xml2js');
var utils =  require(__dirname + '/lib/utils'); // Get common adapter utils

var adapter = utils.adapter({
    name:          'yr',       // adapter name
    dirname:        __dirname, // say own position (optional)
    useFormatDate:  true       // read date format from config
});

adapter.on('ready', function () {
    main();
});

function main() {

    var tmp  = adapter.config.location.split('/');
    var city = unescape(tmp.pop());

    adapter.config.language = adapter.config.language || 'en';

    adapter.setState('forecast.diagram', 'http://www.yr.no/place/' + adapter.config.location + '/avansert_meteogram.png');

    adapter.setObject('forecast', {
        type: 'channel',
        role: 'forecast',
        common: {
            name: 'yr.no forecast ' + city
        },
        native: {
            url:     adapter.config.location,
            country: unescape(tmp[0]),
            state:   unescape(tmp[1]),
            city:    city
        }
    });

    var reqOptions = {
        hostname: 'www.yr.no',
        port:     80,
        path:     '/place/' + adapter.config.location + '/forecast.xml',
        method:   'GET'
    };

    adapter.log.info('get http://' + reqOptions.hostname + reqOptions.path);

    var req = http.request(reqOptions, function (res) {

        var data = '';

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function () {
            adapter.log.debug('received data from yr.no');
            parseData(data.toString());
        });

    });

    req.on('error', function(e) {

        //adapter.log.error(e.message);
        parseData(require('fs').readFileSync(__dirname + '/forecast.xml').toString());
    });

    req.end();

    // Force terminate after 5min
    setTimeout(function () {
        adapter.log.error('force terminate');
        process.exit(1);
    }, 300000);

}

var dictionary = {
    'Now': {'de': 'Jetzt', 'ru': 'Cейчас'},
    'Today': {'de': 'Heute', 'ru': 'Cегодня'},
    'Tomorrow': {'de': 'Morgen', 'ru': 'Завтра'},
    'After tomorrow': {'de': 'Übermorgen', 'ru': 'Послезавтра'},
    "Cloudy": {"en": "Cloudy", "de": "Wolkig", "ru": "Облачно"},
    "Snow": {"en": "Snow", "de": "Schnee", "ru": "Снег"},
    "Partly cloudy": {"en": "Partly cloudy", "de": "Teils Wolkig cloudy", "ru": "Переменная облачность"},
    "Sleet": {"en": "Sleet", "de": "Schneeregen", "ru": "Снег с дождём"},

    "N": {"en": "N", "de": "N", "ru": "C"},
    "S": {"en": "S", "de": "S", "ru": "Ю"},
    "W": {"en": "W", "de": "W", "ru": "З"},
    "E": {"en": "E", "de": "O", "ru": "В"},
    
    "NW": {"en": "NW", "de": "N", "ru": "CЗ"},
    "NNW": {"en": "NNW", "de": "NNW", "ru": "CСЗ"},
    "NWW": {"en": "NWW", "de": "NWW", "ru": "CЗЗ"},
    "NE": {"en": "NE", "de": "NO", "ru": "CВ"},
    "NNE": {"en": "NNE", "de": "NNO", "ru": "CСВ"},
    "NEE": {"en": "NEE", "de": "NOO", "ru": "CВВ"},

    "SW": {"eS": "SW", "de": "S", "ru": "ЮЗ"},
    "SSW": {"eS": "SSW", "de": "SSW", "ru": "ЮЮЗ"},
    "SWW": {"eS": "SWW", "de": "SWW", "ru": "ЮЗЗ"},
    "SE": {"eS": "SE", "de": "SO", "ru": "ЮВ"},
    "SSE": {"eS": "SSE", "de": "SSO", "ru": "ЮЮВ"},
    "SEE": {"eS": "SEE", "de": "SOO", "ru": "ЮВВ"}
};

function _(text) {
    if (!text) return '';

    if (dictionary[text]) {
        var newText = dictionary[text][adapter.config.language];
        if (newText) {
            return newText;
        } else if (lang != 'en') {
            newText = dictionary[text].en;
            if (newText) {
                return newText;
            }
        }
    } else {
        console.log('"' + text + '": {"en": "' + text + '", "de": "' + text + '", "ru": "' + text + '"},');
    }
    return text;
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

            // Set up icon for all states
            for (var i = 0; i < forecastArr.length; i++) {
                var period = forecastArr[i];
                period.symbol.url = 'http://symbol.yr.no/grafikk/sym/b38/' + period.symbol.var + '.png';
            }

            var tableDay =    '<table style="border-collapse: collapse; padding: 0; margin: 0"><tr class="yr-day">';
            var tableHead =   '</tr><tr class="yr-time">';
            var tableMiddle = '</tr><tr class="yr-img">';
            var tableBottom = '</tr><tr class="yr-temp">';
            var dateObj = new Date();
            var dayEnd = dateObj.getFullYear() + '-' + ('0' + (dateObj.getMonth() + 1)).slice(-2) + '-' + ('0' + dateObj.getDate()).slice(-2) + 'T24:00:00';
            var daySwitch = false;

            var day = -1; // Start from today
            var days = [];
            for (var i = 0; i < 12 && i < forecastArr.length; i++) {
                var period = forecastArr[i];

                if (period.period == 0) day++;

                // We want to process only today, tomorrow and the day after tomorrow
                if (day == 3) break;

                period.symbol.name = _(period.symbol.name);

                if (i < 8) {
                    switch (i) {
                        case 0:
                            tableHead += '<td>' + _('Now') + '</td>';
                            break;
                        default:
                            if (period.from > dayEnd) {
                                if (!daySwitch) {
                                    daySwitch = true;
                                    tableDay += '<td colspan="' + i + '">' + _('Today') + '</td><td colspan="4">' + _('Tomorrow') + '</td>';
                                    if (i < 3) tableDay += '<td colspan="' + (4 - i) + '">' + _('After tomorrow') + '</td>';
                                    tableHead += '<td>' + parseInt(period.from.substring(11 ,13), 10).toString() + '-' + parseInt(period.to.substring(11, 13), 10).toString() + '</td>';
                                } else {
                                    tableHead += '<td>' + parseInt(period.from.substring(11, 13), 10).toString() + '-' + parseInt(period.to.substring(11, 13), 10).toString() + '</td>';
                                }

                            } else {
                                tableHead += '<td>' + parseInt(period.from.substring(11, 13), 10).toString() + '-' + parseInt(period.to.substring(11, 13), 10).toString() + '</td>';
                            }
                    }

                    tableMiddle += '<td><img src="' + period.symbol.url + '" alt="' + period.symbol.name + '" title="' + period.symbol.name + '"><br/>';
                    tableBottom += '<td><span class="">' + period.temperature.value + '°C</span></td>';
                }

                if (day == -1 && i == 0) day = 0;
                if (!days[day]) {
                    days[day] = {
                        date:                 new Date(period.from),
                        icon:                 period.symbol.url,
                        text:                 period.symbol.name,
                        temperature_min:      parseFloat(period.temperature.value),
                        temperature_max:      parseFloat(period.temperature.value),
                        precipitation_level:  parseFloat(period.precipitation.value),
                        precipitation_chance: null,
                        wind_direction:       period.windDirection.code,
                        wind_speed:           parseFloat(period.windSpeed.mps) * 3.6,
                        pressure:             parseFloat(period.pressure.value),
                        count:                1
                    };
                } else {
                    // Summarize

                    // Take icon for day always from 12:00 to 18:00 if possible
                    if (i == 2) {
                        days[day].icon = period.symbol.url;
                        days[day].text = period.symbol.name;
                        days[day].wind_direction = period.windDirection.code;
                    }
                    if (period.temperature.value < days[day].temperature_min) days[day].temperature_min = parseFloat(period.temperature.value);
                    if (period.temperature.value > days[day].temperature_max) days[day].temperature_max = parseFloat(period.temperature.value);

                    days[day].precipitation_level += parseFloat(period.precipitation.value);
                    days[day].wind_speed          += parseFloat(period.windSpeed.mps) * 3.6;
                    days[day].pressure            += parseFloat(period.pressure.value);
                    days[day].count++;
                }
                // Set actual temperature
                if (day == 0 && i == 0) {
                    days[day].temperature_actual = period.temperature.value;
                }
            }
            var style = '<style type="text/css">tr.yr-day td {font-family: sans-serif; font-size: 9px; padding:0; margin: 0;}\ntr.yr-time td {text-align: center; font-family: sans-serif; font-size: 10px; padding:0; margin: 0;}\ntr.yr-temp td {text-align: center; font-family: sans-serif; font-size: 12px; padding:0; margin: 0;}\ntr.yr-img td {text-align: center; padding:0; margin: 0;}\ntr.yr-time td img {padding:0; margin: 0;}</style>'
            var table = style + tableDay + tableHead + tableMiddle + tableBottom + '</tr></table>';
            //console.log(JSON.stringify(result, null, "  "));

            for (day = 0; day < days.length; day++) {
                // Take the average
                if (days[day].count > 1) {
                    days[day].precipitation_level /= days[day].count;
                    days[day].wind_speed          /= days[day].count;
                    days[day].pressure            /= days[day].count;
                }
                days[day].temperature_min     = days[day].temperature_min.toFixed(0);
                days[day].temperature_max     = days[day].temperature_max.toFixed(0);
                days[day].precipitation_level = days[day].precipitation_level.toFixed(0);
                days[day].wind_speed          = days[day].wind_speed.toFixed(1);
                days[day].pressure            = days[day].pressure.toFixed(0);

                days[day].date = adapter.formatDate(days[day].date);

                delete days[day].count;
                for (var name in days[day]) {
                    adapter.setState('forecast.day' + day + '.' + name, {val: days[day][name], ack: true});
                }
            }
                       
            adapter.log.debug('data succesfully parsed. setting states');

            adapter.setState('forecast.html',   {val: table, ack: true});
            adapter.setState('forecast.object', {val: days,  ack: true}, function () {
                setTimeout(function () {
                    process.exit(0);
                }, 5000);
            });
        }
    });
}