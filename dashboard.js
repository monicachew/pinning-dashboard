"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
};

var hostMeasures = {
  "CERT_PINNING_MOZ_TEST_RESULTS_BY_HOST": 0,
  //"CERT_PINNING_MOZ_RESULTS_BY_HOST": 1,
};

// Host index into host measures
var hostIds = {
  "addons.mozilla.org": 1,
  "aus4.mozilla.org": 3
};

// Highcharts options.
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
    min: 0
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

var volumeChart;
var volumeOptions = {
  chart: {
    type: 'spline',
    renderTo: 'volume',
  },
  title: {
    text: 'Pinning volumes',
    x: -20 //center
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
      text: 'Pinning volumes'
    },
    min: 0
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

var hostChart;
var hostOptions = {
  chart: {
    type: 'spline',
    renderTo: 'host',
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
      text: 'Pinning violation rates'
    },
    min: 0
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [{ name: 'addons.mozilla.org (test)' },
           //{ name: 'addons.mozilla.org' },
           { name: 'aus4.mozilla.org (test)' },
           //{ name: 'aus4.mozilla.org' },
  ]
};

$(document).ready(function() {
  tsChart = new Highcharts.Chart(tsOptions);
  volumeChart = new Highcharts.Chart(volumeOptions);
  hostChart = new Highcharts.Chart(hostOptions);
});

// Print auxiliary function
function print(line) {
  document.querySelector('#output').textContent += line + "\n";
};

// Initialize telemetry.js
Telemetry.init(function() {
  var version = "nightly/32";
  Object.keys(requiredMeasures).forEach(function (measure) {
    makeChart(version, measure);
  });
  Object.keys(hostMeasures).forEach(function (measure) {
    makeHostChart(version, measure);
  });
});

function makeChart(version, measure) {
  Telemetry.loadEvolutionOverBuilds(version, measure,
    function(histogramEvolution) {
      var ts = [];
      var volume = [];
      var index = requiredMeasures[measure];
      histogramEvolution.each(function(date, histogram) {
        var data = histogram.map(function(count, start, end, index) {
          return count;
        });
        // Failure = 0, success = 1
        ts.push([date.getTime(), data[0] / (data[0] + data[1])]);
        volume.push([date.getTime(), data[0] + data[1]]);
      });
      tsChart.series[index].setData(ts, true);
      volumeChart.series[index].setData(volume, true);
    }
  );
}

function makeHostChart(version, measure) {
  Telemetry.loadEvolutionOverBuilds(version, measure,
    function(histogramEvolution) {
      var amo = [];
      var amoId = hostIds["addons.mozilla.org"];

      var aus4 = [];
      var aus4Id = hostIds["aus4.mozilla.org"];

      histogramEvolution.each(function(date, histogram) {
        var data = histogram.map(function(count, start, end, index) {
          return count;
        });
        // Failure = 0, success = 1
        amo.push([date.getTime(), data[amoId * 2] /
                                  (data[amoId * 2] + data[amoId * 2 + 1])]);
        aus4.push([date.getTime(), data[aus4Id * 2] /
                                  (data[aus4Id * 2] + data[aus4Id * 2 + 1])]);
      });
      //hostChart.series[0].setData(amo, true);
      //hostChart.series[1].setData(aus4, true);
      //print(JSON.stringify(amo));
      //print(JSON.stringify(aus4));
    }
  );
}
