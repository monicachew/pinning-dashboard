"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
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
  makeHostChart(version);
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

function makeHostChart(version) {
  var hostIds = {
    "addons.mozilla.org": { bucket: 1, series: 0 },
    "aus4.mozilla.org": { bucket: 3, series: 1 }
  };
  var data = [];
  var index;
  var rate;
  var measure = "CERT_PINNING_MOZ_TEST_RESULTS_BY_HOST";

  // Set up our series
  var series = [];
  Object.keys(hostIds).forEach(function(host) {
    series[hostIds[host].series] = [];
  });

  Telemetry.loadEvolutionOverBuilds(version, measure,
    function(histogramEvolution) {
      histogramEvolution.each(function(date, histogram) {
        data = histogram.map(function(count, start, end, index) {
          return count;
        });
        // Failure = 0, success = 1
        Object.keys(hostIds).forEach(function(host) {
          index = hostIds[host].bucket * 2;
          rate = data[index] / (data[index] + data[index + 1]);
          series[hostIds[host].series].push([date.getTime(), rate]);
        });
      });
      //print(JSON.stringify(series));
      Object.keys(hostIds).forEach(function(host) {
        hostChart.series[hostIds[host].series]
          .setData(series[hostIds[host].series], true);
      });
    }
  );
}
