"use strict";

// Set up our highcharts
var tsChart;
var tsOptions = {
  chart: {
    type: 'spline',
    renderTo: 'timeseries',
  },
  title: {
    text: 'Pinning violation rates',
    x: -20 //center
  },
  subtitle: {
    text: 'Source: telemetry.mozilla.org',
    x: -20
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { // don't display the dummy year
      month: '%e. %b',
      year: '%b'
    },
    title: {
      text: 'Date'
    },
  },
  yAxis: {
    title: {
      text: 'Pinning violation rate'
    },
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [{ name: 'Test mode' },
           { name: 'Production mode' },
           { name: 'Mozilla test mode' },
           { name: 'Mozilla production mode' },
  ]
};

$(document).ready(function() {
  tsChart = new Highcharts.Chart(tsOptions);
});

// Print auxiliary function
function print(line) {
  document.querySelector('#output').textContent += line + "\n";
};

var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
};

// Initialize telemetry.js
Telemetry.init(function() {
  var version = "nightly/32";
  Object.keys(requiredMeasures).forEach(function (measure) {
    timeSeries(version, measure);
  });
  //print(JSON.stringify(tsChart));
});

function timeSeries(version, measure) {
  Telemetry.loadEvolutionOverBuilds(version, measure,
    function(histogramEvolution) {
      var tsdata = [];
      var tsindex = requiredMeasures[measure];
      histogramEvolution.each(function(date, histogram) {
        var data = histogram.map(function(count, start, end, index) {
          return count;
        });
        // Failure = 0, success = 1
        tsdata.push([date.getTime(), data[0] / (data[0] + data[1])]);
      });
      tsChart.series[tsindex].setData(tsdata, true);
    }
  );
}
