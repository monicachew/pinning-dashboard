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
      // Get aggregate histogram for all dates
      var histogram = histogramEvolution.range();
      print(JSON.stringify(histogram));
      // Print buckets
      histogram.each(function(count, start, end, index) {
        print(count + " hits between " + start + " and " + end);
      });
    });
}
