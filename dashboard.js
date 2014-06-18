"use strict";

// Telemetry histograms.
var requiredMeasures = {
  "CERT_PINNING_TEST_RESULTS" : 0,
  "CERT_PINNING_RESULTS" : 1,
  "CERT_PINNING_MOZ_TEST_RESULTS": 2,
  "CERT_PINNING_MOZ_RESULTS": 3,
};

var tsSeries = { 0: [], 1: [], 2: [], 3: [] };
var volumeSeries = { 0: [], 1: [], 2: [], 3: [] };

var hostIds = {
  "addons.mozilla.org (test)": { bucket: 1, series: 0 },
  "addons.mozilla.org (prod)": { bucket: 1, series: 1 },
  "aus4.mozilla.org (test)": { bucket: 3, series: 2 },
  "accounts.firefox.com (test)": { bucket: 4, series: 3 },
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

var versionedMeasures = [];

// Returns a promise that resolves when all of the requires measures from the
// given version have had their timeseries added.
function verifyVersion(v)
{
  var promises = [];
  var p = new Promise(function(resolve, reject) {
    Telemetry.measures(v, function(measures) {
      for (var m in measures) {
        if (m in requiredMeasures) {
          promises.push(makeTimeseries(v, m));
        }
      }
      resolve(Promise.all(promises));
    });
  });
  return p;
}

function verifyMeasures()
{
  // construct a single graph for all versions of nightly
  var versions = [ "nightly/32", "nightly/33" ];
  var p1 = verifyVersion("nightly/32");
  var p2 = verifyVersion("nightly/33");
  return Promise.all([p1, p2]);
}

// Initialize telemetry.js
Telemetry.init(function() {
  // For nightly versions, we only have one release per date, so we can
  // construct a single graph for all versions of nightly
  verifyMeasures()
    //.then(setSeries())
    .then(print("done"));
});

// Returns a promise that resolves when all of the data has been loaded for a
// particular measure.
function makeTimeseries(version, measure) {
  var index = requiredMeasures[measure];
  var p = new Promise(function(resolve, reject) {
    Telemetry.loadEvolutionOverBuilds(version, measure,
      function(histogramEvolution) {
        histogramEvolution.each(function(date, histogram) {
          var data = histogram.map(function(count, start, end, index) {
            return count;
          });
          // Skip dates with fewer than 1000 submissions
          var minVolume = 1000;
          if (data[0] + data[1] > minVolume) {
            // Failure = 0, success = 1
            date.setUTCHours(0);
            print("Measure: " + measure + " version: " + version +
                  " Date: " + date.toString() + " total: " +
                  (data[0] + data[1]) + " violations: " + data[0]);
            tsSeries[index].push([date.getTime(),
                                  data[0] / (data[0] + data[1])]);
            volumeSeries[index].push([date.getTime(),
                                      data[0] + data[1]]);
          }
        });
        //print("resolving maketimeseries " + JSON.stringify(tsSeries[index], undefined, 2));
        resolve(true);
      }
    );
  });
  return p;
}

function setSeries() {
  for (var i in tsSeries) {
    print("setting series: " + JSON.stringify(tsSeries[i], undefined, 2));
    tsChart.series[i].setData(tsSeries[i], true);
    volumeChart.series[i].setData(volumeSeries[i], true);
  }
  return Promise.resolve(true);
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
