"use strict";

var minDate = new Date(2014, 4, 12);

// Will return something of the form:
// https://hg.mozilla.org/mozilla-central/raw-file/xxxxxxxxxxxx/security/manager/boot/src/StaticHPKPins.h
function changesetToPinFileURL(changeset) {
  return "https://hg.mozilla.org/mozilla-central/raw-file/" +
         changeset +
         "/security/manager/boot/src/StaticHPKPins.h";
}

var buildDateToChangesetCache = {};
function buildDateToChangeset(dateString) {
  var date = new Date(dateString);
  console.log("given date: " + date);
  if (buildDateToChangesetCache[date]) {
    return buildDateToChangesetCache[date];
  }
  const preURL = "http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/";
  const postURL = "-mozilla-central-debug/firefox-32.0a1.en-US.debug-linux-i686.txt";
  // JSON format appears to be YYYY-MM-DDTHH:MM:SS.MMMZ,
  // where "-", "T", ":", ".", and "Z" are literals.
  // We just want YYYY-MM-DD.
  var dateString = date.toJSON().split("T")[0];
  var url = preURL + dateString + postURL;
  var req = new XMLHttpRequest();
  try {
    req.open("GET", url, false); // asynchronous for now
    req.send();
    var changesetURL = req.responseText.split("\n")[1];
    // changesetURL now looks like this:
    // https://hg.mozilla.org/mozilla-central/rev/xxxxxxxxxxxx
    var changeset = changesetURL.split("/").slice(-1);
    buildDateToChangesetCache[date] = changeset;
    return changeset;
  } catch (e) {
    // probably 404
    buildDateToChangesetCache[date] = "";
    return null;
  }
}

// Highcharts options.
var commonTooltip = {
  useHTML: true,
  hideDelay: 1000,
  formatter: function() {
    var changeset = buildDateToChangeset(this.x);
    if (!changeset) {
      return this.y;
    }
    var pinFileURL = changesetToPinFileURL(changeset);
    return this.y + ": <a href='" + pinFileURL + "' target='_blank'>" + changeset + "</a>";
  }
};
var tsChart;
var tsOptions = {
  chart: {
    type: 'spline',
    renderTo: 'timeseries',
  },
  title: {
    text: 'Pinning violation rates',
    x: -20 //center
  },
  subtitle: {
    text: 'Source: telemetry.mozilla.org',
    x: -20
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { // don't display the dummy year
      month: '%e. %b',
      year: '%b'
    },
    title: {
      text: 'Date'
    },
    minTickInterval: 24 * 3600 * 1000,
    min: minDate.getTime()
  },
  yAxis: {
    title: {
      text: 'Pinning violation rate'
    },
    min: 0
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [{ name: 'Test mode' },
           { name: 'Production mode' },
           { name: 'Mozilla test mode' },
           { name: 'Mozilla production mode' },
  ],
  tooltip: commonTooltip
};

var volumeChart;
var volumeOptions = {
  chart: {
    type: 'spline',
    renderTo: 'volume',
  },
  title: {
    text: 'Pinning volumes',
    x: -20 //center
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { // don't display the dummy year
      month: '%e. %b',
      year: '%b'
    },
    title: {
      text: 'Date'
    },
    minTickInterval: 24 * 3600 * 1000,
    min: minDate.getTime()
  },
  yAxis: {
    title: {
      text: 'Pinning volumes'
    },
    min: 0
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [{ name: 'Test mode' },
           { name: 'Production mode' },
           { name: 'Mozilla test mode' },
           { name: 'Mozilla production mode' },
  ],
  tooltip: commonTooltip
};

var hostChart;
var hostOptions = {
  chart: {
    type: 'spline',
    renderTo: 'host',
  },
  title: {
    text: 'Pinning violation rates for mozilla hosts',
    x: -20 //center
  },
  subtitle: {
    text: 'Source: telemetry.mozilla.org',
    x: -20
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { // don't display the dummy year
      month: '%e. %b',
      year: '%b'
    },
    title: {
      text: 'Date'
    },
    minTickInterval: 24 * 3600 * 1000,
    min: minDate.getTime()
  },
  yAxis: {
    title: {
      text: 'Pinning violation rates'
    },
    min: 0
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [
    { name: 'addons.mozilla.org (test)' },
    { name: 'aus4.mozilla.org (test)' },
  ],
  tooltip: commonTooltip
};

var hostVolumeChart;
var hostVolumeOptions = {
  chart: {
    type: 'spline',
    renderTo: 'hostVolume',
  },
  title: {
    text: 'Pinning volumes for mozilla hosts',
    x: -20 //center
  },
  subtitle: {
    text: 'Source: telemetry.mozilla.org',
    x: -20
  },
  xAxis: {
    type: 'datetime',
    dateTimeLabelFormats: { // don't display the dummy year
      month: '%e. %b',
      year: '%b'
    },
    title: {
      text: 'Date'
    },
    minTickInterval: 24 * 3600 * 1000,
    min: minDate.getTime()
  },
  yAxis: {
    title: {
      text: 'Pinning volumes'
    },
    min: 0
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 0
  },
  series: [
    { name: 'addons.mozilla.org (test)' },
    { name: 'aus4.mozilla.org (test)' },
  ],
  tooltip: commonTooltip
};
