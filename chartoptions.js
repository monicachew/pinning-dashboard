"use strict";

var minDate = new Date(2014, 4, 12);

function changesetToPinFileURL(changeset) {
  return "https://hg.mozilla.org/mozilla-central/file/" +
         changeset +
         "/security/manager/boot/src/StaticHPKPins.h";
}

var buildDateToChangesetCache = {};
function buildDateToChangeset(timeInMillis) {
  var date = new Date(timeInMillis);
  if (buildDateToChangesetCache[date]) {
    return buildDateToChangesetCache[date];
  }
  // This is fragile (for example, when nightly becomes Firefox 33, this won't
  // work anymore). I'm told bug 487036 will implement what we actually want
  // here.
  var preURL = "http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/";
  var postURL = "-mozilla-central-debug/firefox-32.0a1.en-US.debug-linux-i686.txt";
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
  }
};

var flags = {
  type: 'flags',
  showInLegend: false,
  data: [
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
      min: minDate.getTime()
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
    { name: 'aus4.mozilla.org (test)' }
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
    { name: 'aus4.mozilla.org (test)' }
  ]
};
