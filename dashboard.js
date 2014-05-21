"use strict";

// Set up our highcharts
var tsChart;
var tsOptions = {
  chart: {
    renderTo: 'timeseries',
  },
  series: [{
    name: 'Test',
    data: [0.01, 0, 0.01]
  }]
};

$(document).ready(function() {
  tsChart = new Highcharts.Chart(tsOptions);
});

// Print auxiliary function
function print(line) {
  document.querySelector('#output').textContent += line + "\n";
};

var earliestVersion = 32;
var validVersions;

var requiredMeasures = [
  "CERT_PINNING_TEST_RESULTS",
  //"CERT_PINNING_MOZ_TEST_RESULTS",
  //"CERT_PINNING_MOZ_TEST_RESULTS_BY_HOST"
];

// Initialize telemetry.js
Telemetry.init(function() {
  // Get versions available
  var versions = Telemetry.versions();

  validVersions = [ "nightly/32" ];
  print("----------------------------------------");
  validVersions.forEach(function(version) {
    print("Loading histograms for " + version);
    requiredMeasures.forEach(function (measure) {
      timeSeries(version, measure);
    });
  });
});

function timeSeries(version, measure) {
  print("");
  print("----------------------------------------");
  print("Load histogram evolution over " + version + " for " + measure);
  Telemetry.loadEvolutionOverBuilds(version, measure,
    function(histogramEvolution) {
      histogramEvolution.each(function(date, histogram) {
        print(date);
        print(JSON.stringify(histogram));
        // Print buckets
        histogram.each(function(count, start, end, index) {
          print(count + " hits between " + start + " and " + end);
        });
      });
    });
}

$(function() {
$('#container').highcharts({
  title: {
    text: 'Monthly Average Temperature',
    x: -20 //center
  },
  subtitle: {
    text: 'Source: WorldClimate.com',
    x: -20
  },
  xAxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  yAxis: {
    title: {
      text: 'Temperature (°C)'
    },
    plotLines: [{
      value: 0,
      width: 1,
      color: '#808080'
    }]
  },
  tooltip: {
    valueSuffix: '°C'
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [{
    name: 'Tokyo',
    data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
  }, {
    name: 'New York',
    data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
  }, {
    name: 'Berlin',
    data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
  }, {
    name: 'London',
    data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
  }]
});
});
