"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
};

var hostIds = {
  "addons.mozilla.org (test)": { bucket: 1, series: 0 },
  "addons.mozilla.org (prod)": { bucket: 1, series: 1 },
  "aus4.mozilla.org (test)": { bucket: 3, series: 2 },
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

function hostMatchesType(host, type) {
  return host.indexOf(type) != -1;
}

function filterEvolution(measure, measureType, matchingHosts,
                         histogramEvolution) {
  // Set up our series
  var rates = [];
  var volume = [];
  Object.keys(hostIds).forEach(function(host) {
    rates[hostIds[host].series] = [];
    volume[hostIds[host].series] = [];
  });

  histogramEvolution.each(function(date, histogram) {
    var data = histogram.map(function(count, start, end, index) {
      return count;
    });
    date.setUTCHours(0);
    matchingHosts.forEach(function(host) {
      // Failure = index + 0, success = index + 1
      var index = hostIds[host].bucket * 2;
      var rate = 0;
      if (data[index] && (data[index] + data[index + 1] > 0)) {
        rate = data[index] / (data[index] + data[index + 1]);
      }
      rates[hostIds[host].series].push([date.getTime(), rate]);
      volume[hostIds[host].series].push([date.getTime(),
                                         data[index] + data[index + 1]]);
    });
  });
  matchingHosts.forEach(function(host) {
    hostChart.series[hostIds[host].series]
      .setData(rates[hostIds[host].series], true);
  });
  matchingHosts.forEach(function(host) {
    hostVolumeChart.series[hostIds[host].series]
      .setData(volume[hostIds[host].series], true);
  });
}

function makeHostChart(version) {
  var measures = [ "CERT_PINNING_MOZ_TEST_RESULTS_BY_HOST",
                   "CERT_PINNING_MOZ_RESULTS_BY_HOST" ];

  measures.forEach(function(measure) {
    var measureType = "test";
    if (measure.indexOf("TEST") == -1) {
      measureType = "prod";
    }
    var matchingHosts = Object.keys(hostIds).filter(function(host) {
      return host.indexOf(measureType) != -1;
    });
    var f = filterEvolution.bind(this, measure, measureType, matchingHosts);
    Telemetry.loadEvolutionOverBuilds(version, measure, f);
  });
}
