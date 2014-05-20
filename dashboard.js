"use strict";

// Print auxiliary function
function print(line) {
  document.querySelector('#output').textContent += line + "\n";
};

var earliestVersion = 32;
var validVersions;

var requiredMeasures = [
  "CERT_PINNING_TEST_RESULTS",
  "CERT_PINNING_MOZ_TEST_RESULTS",
  "CERT_PINNING_MOZ_TEST_RESULTS_BY_HOST"
];

function checkVersion(version) {
  var valid = true;
  Telemetry.measures(version, function(measures) {
    requiredMeasures.forEach(function(requiredMeasure) {
      if (!(requiredMeasure in measures)) {
        valid = false;
      }
    });
    if (valid) {
      print("Found all required measures in " + version);
    }
  });
  return valid;
}

// Initialize telemetry.js
Telemetry.init(function() {
  // Get versions available
  var versions = Telemetry.versions();
  
  // Print all versions
  validVersions = versions.filter(function(version) {
    return checkVersion(version);
  });
  validVersions = ["nightly/32"];
  print("Valid versions available:");
  print("");
  print("----------------------------------------");
  validVersions.forEach(function(version) {
    print(version);
  });
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
      // Get aggregate histogram for all dates
      var histogram = histogramEvolution.range();
      
      // Print buckets
      histogram.each(function(count, start, end, index) {
        print(count + " hits between " + start + " and " + end);
      });
    });
}
