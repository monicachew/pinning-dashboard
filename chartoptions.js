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
    var y = this.y;
    if (this.y < 1) {
      y = y.toFixed(6);
    }
    if (!changeset) {
      return y;
    }
    var pinFileURL = changesetToPinFileURL(changeset);
    return y + ": rev <a href='" + pinFileURL + "' target='_blank'>" + changeset + "</a>";
  }
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
      min: 0
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
      borderWidth: 0
    }
  })
});

var tsChart;
var tsOptions = {
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
           { name: 'Mozilla production mode' }
  ]
};

var volumeChart;
var volumeOptions = {
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
           { name: 'Mozilla production mode' }
  ]
};

var hostChart;
var hostOptions = {
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
