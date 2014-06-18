"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
};

// Per-host measures.
var hostMeasures = [ "CERT_PINNING_MOZ_TEST_RESULTS_BY_HOST",
                     "CERT_PINNING_MOZ_RESULTS_BY_HOST" ];

// Hosts for which we keep per-host pinning violation counts.
var hostIds = {
  "addons.mozilla.org (test)": { bucket: 1, series: 0 },
  "addons.mozilla.org (prod)": { bucket: 1, series: 1 },
  "aus4.mozilla.org (test)": { bucket: 3, series: 2 },
  "accounts.firefox.com (test)": { bucket: 4, series: 3 },
};

// Versions for which we have any data.
var versions = [ "nightly/32", "nightly/33" ];

// Minimum volume for which to display data
var minVolume = 1000;

// Array of [[version, measure]] for requesting loadEvolutionOverBuilds.
var versionedMeasures = [];

// Set up our series
var tsSeries = {};
var volumeSeries = {};
Object.keys(requiredMeasures).forEach(function(m) {
  tsSeries[requiredMeasures[m]] = [];
  volumeSeries[requiredMeasures[m]] = [];
});

var hostRates = [];
var hostVolume = [];
Object.keys(hostIds).forEach(function(host) {
  hostRates[hostIds[host].series] = [];
  hostVolume[hostIds[host].series] = [];
});

// Setup our highcharts on document-ready.
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
  // For nightly versions, we only have one release per date, so we can
  // construct a single graph for all versions of nightly.
  makeTimeseries();
  makeHostCharts();
});

// Sort [date, {rate|volume}] pairs based on the date
function sortByDate(p1, p2)
{
  return p1[0] - p2[0];
}

// Returns a promise that resolves when all of the versions for all of the
// required measures have been stuffed into the timeseries.
function makeTimeseries()
{
  // construct a single graph for all versions of nightly
  var promises = [];
  versions.forEach(function(v) {
    promises.push(makeTimeseriesForVersion(v));
  });
  return Promise.all(promises)
    .then(function() {
      // Wait until all of the series data has been returned before redrawing
      // highcharts.
      for (var i in tsSeries) {
        tsSeries[i] = tsSeries[i].sort(sortByDate);
        volumeSeries[i] = volumeSeries[i].sort(sortByDate);
        tsChart.series[i].setData(tsSeries[i], true);
        volumeChart.series[i].setData(volumeSeries[i], true);
      }
    });
}

// Returns a promise that resolves when all of the requires measures from the
// given version have had their timeseries added.
function makeTimeseriesForVersion(v)
{
  var promises = [];
  var p = new Promise(function(resolve, reject) {
    Telemetry.measures(v, function(measures) {
      for (var m in measures) {
	// Telemetry.loadEvolutionOverBuilds(v, m) never calls the callback if
	// the given measure doesn't exist for that version, so we must make
	// sure to only call makeTimeseries for measures that exist.
	if (m in requiredMeasures) {
          promises.push(makeTimeseriesForMeasure(v, m));
        }
      }
      resolve(Promise.all(promises));
    });
  });
  return p;
}

// Returns a promise that resolves when all of the data has been loaded for a
// particular measure. Don't redraw highcharts here because appending to the
// existing series data will cause a race condition in the event of multiple
// versions.
function makeTimeseriesForMeasure(version, measure) {
  var index = requiredMeasures[measure];
  var p = new Promise(function(resolve, reject) {
    Telemetry.loadEvolutionOverBuilds(version, measure,
      function(histogramEvolution) {
        histogramEvolution.each(function(date, histogram) {
          var data = histogram.map(function(count, start, end, index) {
            return count;
          });
          // Skip dates with fewer than 1000 submissions
          // Failure = 0, success = 1
          if (data[0] + data[1] > minVolume) {
            date.setUTCHours(0);
            //print("Measure: " + measure + " version: " + version +
            //      " Date: " + date.toString() + " total: " +
            //      (data[0] + data[1]) + " violations: " + data[0]);
            tsSeries[index].push([date.getTime(),
                                  data[0] / (data[0] + data[1])]);
            volumeSeries[index].push([date.getTime(),
                                      data[0] + data[1]]);
          }
        });
        // We've collected all of the data for this version, so resolve.
        resolve(true);
      }
    );
  });
  return p;
}

function makeHostCharts() {
  var promises = [];
  hostMeasures.forEach(function(m) {
    versions.forEach(function(v) {
      promises.push(makeHostChart(v, m));
    });
  });
  Promise.all(promises)
    .then(function() {
      Object.keys(hostIds).forEach(function(host) {
        var i = hostIds[host].series;
        hostRates[i] = hostRates[i].sort(sortByDate);
        hostVolume[i] = hostVolume[i].sort(sortByDate);
        hostChart.series[i].setData(hostRates[i], true);
        hostVolumeChart.series[i].setData(hostVolume[i], true);
      });
    });
}

// Returns a promise that resolves when the host timeseries is created for a
// given measure.
function makeHostChart(version, measure) {
  return new Promise(function(resolve, reject) {
    var f = filterEvolution.bind(this, measure);
    Telemetry.loadEvolutionOverBuilds(version, measure,
      function(histogramEvolution) {
        f(histogramEvolution);
        resolve(true);
      });
    });
}

// Returns true if the host (e.g., "addons.mozilla.org (test)") matches the
// measure type (e.g., "test" or "prod")
function hostMatchesType(host, type) {
  return host.indexOf(type) != -1;
}

// Put the given measure into the host timeseries.
function filterEvolution(measure, histogramEvolution) {
  var measureType = "test";
  if (measure.indexOf("TEST") == -1) {
    measureType = "prod";
  }
  var matchingHosts = Object.keys(hostIds).filter(function(host) {
    return host.indexOf(measureType) != -1;
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
      if (data[index] + data[index + 1] > minVolume) {
        hostRates[hostIds[host].series].push([date.getTime(), rate]);
        hostVolume[hostIds[host].series].push([date.getTime(),
                                           data[index] + data[index + 1]]);
      }
    });
  });
}
