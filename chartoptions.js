"use strict";

var minDate = new Date(2014, 4, 12);

function changesetToPinFileURL(changeset) {
  return "https://hg.mozilla.org/mozilla-central/file/" +
         changeset +
         "/security/manager/boot/src/StaticHPKPins.h";
}

// To simplify things, just say everything before 9 June 2014 was 32,
// and everything after is 33. We'll have to update this in the future.
function buildDateToVersion(timeInMillis) {
  var mergeDate = new Date("9 June 2014");
  var date = new Date(timeInMillis);
  return date < mergeDate ? "32" : "33";
}

var buildDateToChangesetCache = {};
function buildDateToChangeset(timeInMillis) {
  var date = new Date(timeInMillis);
  if (buildDateToChangesetCache[date]) {
    return buildDateToChangesetCache[date];
  }
  // This is fragile (for example, it doesn't handle Aurora builds yet).
  // I'm told bug 487036 will implement what we actually want here.
  var versionString = buildDateToVersion(timeInMillis);
  var preURL = "http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/";
  var postURL = "-mozilla-central-debug/firefox-" + versionString +
                ".0a1.en-US.debug-linux-i686.txt";
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
    return null;
  }
}

// Highcharts options.
var commonTooltip = {
  useHTML: true,
  hideDelay: 1000,
  formatter: function() {
    var changeset = buildDateToChangeset(this.x);
    var pinFileURL = changesetToPinFileURL(changeset);
    var s = "<b>" + Highcharts.dateFormat("%A, %b %e", this.x) + "</b>";
    if (changeset) {
      s += "<br/>Changeset: <a href='" + pinFileURL +
           "' target='_blank'>" + changeset + "</a>";
    }
    $.each(this.points, function(i, point) {
      var y = point.y;
      if (point.y < 1) {
        y = y.toFixed(6);
      }
      s += "<br/>" + point.series.name + ": " + y;
    });
    return s;
  },
  positioner: function(labelWidth, labelHeight, point) {
    return { x: point.plotX - (labelWidth / 2), y: point.plotY - 10 };
  }
};

// Events for hosts for which we don't have per-host violations.
var flag_data = {
  nightly: [
    {
      x: Date.UTC(2014, 4, 24),
      title: 'Twitter production',
      text: 'Twitter moved to production'
    },
    {
      x: Date.UTC(2014, 4, 24),
      title: 'Google root PEMs',
      text: 'Google switched to root PEMs'
    },
    {
      x: Date.UTC(2014, 4, 29),
      title: 'Mozilla cdn, media production',
      text: 'Mozilla cdn, media production'
    },
    {
      x: Date.UTC(2014, 5, 12),
      title: 'Google production',
      text: 'Google moved to production'
    },
    {
      x: Date.UTC(2014, 5, 19),
      title: '*.twitter.com (test)',
      text: '*.twitter.com (test)'
    },
    {
      x: Date.UTC(2014, 6, 8),
      title: '*.twitter.com (prod)',
      text: '*.twitter.com (prod)'
    },
    {
      x: Date.UTC(2014, 6, 8),
      title: 'dropbox (test)',
      text: 'dropbox (test)'
    },
    {
      x: Date.UTC(2014, 7, 7),
      title: 'dropbox (prod)',
      text: 'dropbox (prod)'
    },
    {
      x: Date.UTC(2014, 7, 28),
      title: 'facebook (test)',
      text: 'facebook (test)'
    },
  ],
  aurora: [
    {
      x: Date.UTC(2014, 5, 9),
      title: 'Twitter, cdn, media production',
      text: 'Twitter moved to production'
    },
    {
      x: Date.UTC(2014, 5, 9),
      title: 'Google (test)',
      text: 'Google (test)'
    },
  ]
};

var flags = {
  type: 'flags',
  showInLegend: false
};

// Events for mozilla hosts for which we have per-host violations.
var moz_flags = {
  type: 'flags',
  showInLegend: false,
  data: [
    {
      x: Date.UTC(2014, 5, 5),
      title: 'AMO production',
      text: 'AMO production'
    },
    {
      x: Date.UTC(2014, 5, 8),
      title: 'FxA test',
      text: 'FxA test'
    },
    {
      x: Date.UTC(2014, 6, 3),
      title: 'api.FxA test',
      text: 'api.FxA test'
    },
    {
      x: Date.UTC(2014, 6, 16),
      title: 'FxA prod',
      text: 'FxA prod'
    }
    {
      x: Date.UTC(2014, 9, 11),
      title: 'services test',
      text: 'services test'
    }
  ]
};

$(function() {
  Highcharts.setOptions({
    tooltip: commonTooltip,
    chart: {
      type: 'spline'
    },
    title: {
      x: -20 //center
    },
    xAxis: {
      type: 'datetime',
      minTickInterval: 24 * 3600 * 1000,
      // Why is this breaking?
      // min: minDate.getTime()
    },
    yAxis: {
      min: 0
    },
  })
});

var tsChart;
var tsOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'timeseries'
  },
  title: {
    text: 'Pinning violation rates'
  },
  yAxis: {
    title: {
      text: 'Pinning violation rate'
    },
  },
  series: [{ name: 'Test mode' },
           { name: 'Production mode' },
           { name: 'Mozilla test mode' },
           { name: 'Mozilla production mode' },
           flags
  ]
};

var volumeChart;
var volumeOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'volume'
  },
  title: {
    text: 'Pinning volumes'
  },
  yAxis: {
    title: {
      text: 'Pinning volumes'
    }
  },
  series: [{ name: 'Test mode' },
           { name: 'Production mode' },
           { name: 'Mozilla test mode' },
           { name: 'Mozilla production mode' },
           flags
  ]
};

var hostChart;
var hostOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'host'
  },
  title: {
    text: 'Pinning violation rates for mozilla hosts'
  },
  yAxis: {
    title: {
      text: 'Pinning violation rates'
    },
  },
  series: [
    { name: 'addons.mozilla.org (test)' },
    { name: 'addons.mozilla.org (prod)' },
    { name: 'aus4.mozilla.org (test)' },
    { name: 'accounts.firefox.com (test)' },
    { name: 'accounts.firefox.com (prod)' },
    { name: 'api.accounts.firefox.com (test)' },
    { name: 'api.accounts.firefox.com (prod)' },
    { name: 'services.mozilla.com (test)' },
    { name: 'services.mozilla.com (prod)' },
    moz_flags
  ]
};

var hostVolumeChart;
var hostVolumeOptions = {
  legend: {
    enabled: true,
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
    borderWidth: 2
  },
  chart: {
    renderTo: 'hostVolume'
  },
  title: {
    text: 'Pinning volumes for mozilla hosts'
  },
  yAxis: {
    title: {
      text: 'Pinning volumes'
    },
  },
  series: [
    { name: 'addons.mozilla.org (test)' },
    { name: 'addons.mozilla.org (prod)' },
    { name: 'aus4.mozilla.org (test)' },
    { name: 'accounts.firefox.com (test)' },
    { name: 'accounts.firefox.com (prod)' },
    { name: 'api.accounts.firefox.com (test)' },
    { name: 'api.accounts.firefox.com (prod)' },
    { name: 'services.mozilla.com (test)' },
    { name: 'services.mozilla.com (prod)' },
    moz_flags
  ]
};
