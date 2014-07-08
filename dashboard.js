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
  "api.accounts.firefox.com (test)": { bucket: 5, series: 4 },
};

// Versions for which we have any data.
var channels = {
  nightly: [ "nightly/32", "nightly/33" ],
  aurora: [ "aurora/32" ]
};
var currentChannel = "nightly";

// Minimum volume for which to display data
var minVolume = 1000;

// Array of [[version, measure]] for requesting loadEvolutionOverBuilds.
var versionedMeasures = [];

// Set up our series
var tsSeries = {};
var volumeSeries = {};
var hostRates = [];
var hostVolume = [];
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

function changeView(channel) {
  // Unselect the old channel
  document.querySelector("#" + currentChannel)
      .setAttribute("style", "background-color:white");
  currentChannel = channel;
  makeGraphsForChannel(currentChannel);
  // Select the new channel. The highlighted button uses the same green color as
  // Highcharts.
  document.querySelector("#" + currentChannel)
    .setAttribute("style", "background-color:#90ed7d");
}

// Initialize telemetry.js
Telemetry.init(function() {
  // For nightly versions, we only have one release per date, so we can
  // construct a single graph for all versions of nightly.
  changeView("nightly");
});

function makeGraphsForChannel(channel) {
  Object.keys(requiredMeasures).forEach(function(m) {
    tsSeries[requiredMeasures[m]] = [];
    volumeSeries[requiredMeasures[m]] = [];
  });

  Object.keys(hostIds).forEach(function(host) {
    hostRates[hostIds[host].series] = [];
    hostVolume[hostIds[host].series] = [];
  });

  makeTimeseries(channel, channels[channel]);
  makeHostCharts(channels[channel]);
}
// Sort [date, {rate|volume}] pairs based on the date
function sortByDate(p1, p2)
{
  return p1[0] - p2[0];
}

// Filter duplicate dates to account for screwed up telemetry data
function filterDuplicateDates(series)
{
  // Work on a copy
  var s = series;

  // Series is an array of pairs [[date, volume]]. If successive dates have the
  // same volume, delete
  for (var i = s.length - 1; i > 0; i--) {
    if (s[i][0] == s[i-1][0]) {
      if (s[i][1] > 0) {
        s.splice(i - 1, 1);
      } else {
        s.splice(i, 1);
      }
    }
  }
  return s;
}

function normalizeSeries(series)
{
  return filterDuplicateDates(series.sort(sortByDate));
}

// Returns a promise that resolves when all of the versions for all of the
// required measures have been stuffed into the timeseries.
function makeTimeseries(channel, versions)
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
        tsSeries[i] = normalizeSeries(tsSeries[i]);
        volumeSeries[i] = normalizeSeries(volumeSeries[i]);
        tsChart.series[i].setData(tsSeries[i], true);
        volumeChart.series[i].setData(volumeSeries[i], true);
      }
      // For some reason, tsChart.series.length == 6!
      var flag_index = 4;
      tsChart.series[flag_index].setData(flag_data[channel], true);
      volumeChart.series[flag_index].setData(flag_data[channel], true);
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

function makeHostCharts(versions) {
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
        hostRates[i] = normalizeSeries(hostRates[i]);
        hostVolume[i] = normalizeSeries(hostVolume[i]);
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
      // Don't filter on minVolume for mozilla hosts, because some hosts like
      // FxA don't get very much traffic.
      hostRates[hostIds[host].series].push([date.getTime(), rate]);
      hostVolume[hostIds[host].series].push([date.getTime(),
                                             data[index] + data[index + 1]]);
    });
  });
}
