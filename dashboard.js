"use strict";

// Print auxiliary function
function print(line) {
    document.querySelector('#output').textContent += line + "\n";
};

// Initialize telemetry.js
Telemetry.init(function() {
    // Get versions available
    var versions = Telemetry.versions();
    
    // Print all versions
    print("Versions available:");
    versions.forEach(function(version) {
        print(version);
    });
    print("");
    print("----------------------------------------");
    
    // Let's just use the first version
    var version = versions[0];
    
    // Fetch measures
    print("Loading measures for " + version);
    Telemetry.measures(version, function(measures) {
        // Print measures available
        print("Measures available:")
        for(var measure in measures) {
            print(measure);
        }
        
        // Choose a measure
        var measure = Object.keys(measures)[0];
        print("");
        print("----------------------------------------");
        print("Load histogram evolution over build for " + measure);
        Telemetry.loadEvolutionOverBuilds(
            version,
            measure,
            function(histogramEvolution) 
        {
            // Get aggregate histogram for all dates
            var histogram = histogramEvolution.range();
            
            // Print buckets
            histogram.each(function(count, start, end, index) {
                print(count + " hits between " + start + " and " + end);
            });
        });
    });
});
