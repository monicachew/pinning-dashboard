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
  "addons.mozilla.org (prod)": { bucket: 1, series: 0 },
  "addons.mozilla.net (prod)": { bucket: 2, series: 1 },
  "aus4.mozilla.org (test)": { bucket: 3, series: 2 },
  "accounts.firefox.com (prod)": { bucket: 4, series: 3 },
  "api.accounts.firefox.com (prod)": { bucket: 5, series: 4 },
  "services.mozilla.com (prod)": { bucket: 6, series: 5 },
  "aus5.mozilla.org (test)": { bucket: 7, series: 6 },
};

// Versions for which we have any data.
var channels = {
  nightly: [ "nightly/48", "nightly/49", "nightly/50", "nightly/51" ],
  aurora: [ "aurora/47", "aurora/48", "aurora/49", "aurora/50" ],
  beta: [ "beta/46", "beta/47", "beta/48", "beta/49" ],
  release: [ "release/45", "release/46", "release/47", "release/48" ],
};
var currentChannel = "nightly";

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
  for (var i in tsSeries) {
    tsChart.series[i].setData(null);
    volumeChart.series[i].setData(null);
  }
  Object.keys(hostIds).forEach(function(host) {
    var i = hostIds[host].series;
    hostChart.series[i].setData(null);
    hostVolumeChart.series[i].setData(null);
  });
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

  makeTimeseries(channel, channels[channel]).then(
  makeHostCharts(channels[channel]));
}
// Sort [date, {rate|volume}] pairs based on the date
function sortByDate(p1, p2)
{
  return p1[0] - p2[0];
}

// Filter duplicate dates to account for screwed up telemetry data
function filterDuplicateDates(series)
{
  // Work on a copy so we don't cause side-effects without realizing.
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

// Some data points have the same date. Combine their volumes.
function combineDuplicateDates(series)
{
  var s = [];

  series.forEach((pair) => {
    var sameDates = series.filter((matchingPair) => {
      return matchingPair[0] == pair[0];
    });
    var newPair = [pair[0], pair[1] instanceof Rate ? new Rate(0, 0) : 0];
    sameDates.forEach((matchingPair) => {
      if (newPair[1] instanceof Rate) {
        newPair[1].add(matchingPair[1]);
      } else {
        newPair[1] += matchingPair[1];
      }
    });
    s.push(newPair);
  });
  return s;
}

function collapseRates(series)
{
  var s = [];
  series.forEach((pair) => {
    if (pair[1] instanceof Rate) {
      s.push([pair[0], pair[1].toFraction()]);
    } else {
      s.push(pair);
    }
  });
  return s;
}

function normalizeSeries(series)
{
  return collapseRates(combineDuplicateDates(series.sort(sortByDate)));
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
    });
}

// Returns a promise that resolves when all of the requires measures from the
// given version have had their timeseries added.
// v is something like "channel/version"
function makeTimeseriesForVersion(v) {
  var promises = [];
  for (var m in requiredMeasures) {
    // Telemetry.loadEvolutionOverBuilds(v, m) never calls the callback if
    // the given measure doesn't exist for that version, so we must make
    // sure to only call makeTimeseries for measures that exist.
    promises.push(makeTimeseriesForMeasure(v, m));
  }
  return Promise.all(promises);
}

// Returns a promise that resolves when all of the data has been loaded for a
// particular measure. Don't redraw highcharts here because appending to the
// existing series data will cause a race condition in the event of multiple
// versions.
// v is something like "channel/version"
function makeTimeseriesForMeasure(version, measure) {
  var index = requiredMeasures[measure];
  var p = new Promise(function(resolve, reject) {
    Telemetry.getEvolution(version.substring(0, version.indexOf("/")),
      version.substring(version.indexOf("/") + 1), measure, {}, true,
      function(histogramEvolutionMap) {
        let histogramEvolution = histogramEvolutionMap[""]; // ಠ_ಠ
        if (histogramEvolution) {
          histogramEvolution.map(function(histogram, i, date) {
            var data = histogram.map(function(count, start, end, index) {
              return count;
            });
            date.setUTCHours(0);
            tsSeries[index].push([date.getTime(),
                                  new Rate(data[0], (data[0] + data[1]))]);
            volumeSeries[index].push([date.getTime(),
                                      data[0] + data[1]]);
          });
        }
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
    Telemetry.getEvolution(version.substring(0, version.indexOf("/")),
      version.substring(version.indexOf("/") + 1), measure, {}, true,
      function(histogramEvolutionMap) {
        let histogramEvolution = histogramEvolutionMap[""]; // ಠ_ಠ
        if (histogramEvolution) {
          f(histogramEvolution);
        }
        resolve(true);
      });
    });
}

class Rate {
  constructor(hits, total) {
    this._hits = hits;
    this._total = total;
  }

  add(otherRate) {
    this._hits += otherRate._hits;
    this._total += otherRate._total;
  }

  toFraction() {
    if (this._total == 0) {
      return 0;
    }
    return this._hits / this._total;
  }
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

  histogramEvolution.map(function(histogram, i, date) {
    var data = histogram.map(function(count, start, end, index) {
      return count;
    });
    date.setUTCHours(0);
    matchingHosts.forEach(function(host) {
      // Failure = index + 0, success = index + 1
      var index = hostIds[host].bucket * 2;
      var rate = new Rate(0, 0);
      if (data[index] && (data[index] + data[index + 1]) > 0) {
        rate = new Rate(data[index], (data[index] + data[index + 1]));
      }
      hostRates[hostIds[host].series].push([date.getTime(), rate]);
      hostVolume[hostIds[host].series].push([date.getTime(),
                                             data[index] + data[index + 1]]);
    });
  });
}
