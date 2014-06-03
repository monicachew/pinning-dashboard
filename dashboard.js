"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
};

$(document).ready(function() {
  tsChart = new Highcharts.StockChart(tsOptions);
  volumeChart = new Highcharts.StockChart(volumeOptions);
  hostChart = new Highcharts.StockChart(hostOptions);
  hostVolumeChart = new Highcharts.StockChart(hostVolumeOptions);
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
        // Skip dates with fewer than 1000 submissions
        var minVolume = 1000;
        if (data[0] + data[1] > minVolume) {
          // Failure = 0, success = 1
          date.setUTCHours(0);
          ts.push([date.getTime(), data[0] / (data[0] + data[1])]);
          volume.push([date.getTime(), data[0] + data[1]]);
        }
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
  var volume = [];
  Object.keys(hostIds).forEach(function(host) {
    series[hostIds[host].series] = [];
    volume[hostIds[host].series] = [];
  });

  Telemetry.loadEvolutionOverBuilds(version, measure,
    function(histogramEvolution) {
      histogramEvolution.each(function(date, histogram) {
        data = histogram.map(function(count, start, end, index) {
          return count;
        });
        // Failure = 0, success = 1
        date.setUTCHours(0);
        Object.keys(hostIds).forEach(function(host) {
          index = hostIds[host].bucket * 2;
          rate = 0;
          if (data[index] && (data[index] + data[index + 1] > 0)) {
            rate = data[index] / (data[index] + data[index + 1]);
          }
          series[hostIds[host].series].push([date.getTime(), rate]);
          volume[hostIds[host].series].push([date.getTime(),
                                             data[index] + data[index + 1]]);
        });
      });
      Object.keys(hostIds).forEach(function(host) {
        hostChart.series[hostIds[host].series]
          .setData(series[hostIds[host].series], true);
      });
      Object.keys(hostIds).forEach(function(host) {
        hostVolumeChart.series[hostIds[host].series]
          .setData(volume[hostIds[host].series], true);
      });
    }
  );
}
