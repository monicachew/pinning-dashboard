"use strict";

// Highcharts options.
var commonTooltip = {
  useHTML: true,
  hideDelay: 1000,
  formatter: function() {
    var s = "<b>" + Highcharts.dateFormat("%A, %b %e", this.x) + "</b>";
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
    { name: 'addons.mozilla.org (prod)' },
    { name: 'addons.mozilla.net (prod)' },
    { name: 'aus4.mozilla.org (test)' },
    { name: 'accounts.firefox.com (prod)' },
    { name: 'api.accounts.firefox.com (prod)' },
    { name: 'services.mozilla.com (prod)' },
    { name: 'aus5.mozilla.org (test)' },
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
    { name: 'addons.mozilla.org (prod)' },
    { name: 'addons.mozilla.net (prod)' },
    { name: 'aus4.mozilla.org (test)' },
    { name: 'accounts.firefox.com (prod)' },
    { name: 'api.accounts.firefox.com (prod)' },
    { name: 'services.mozilla.com (prod)' },
    { name: 'aus5.mozilla.org (test)' },
  ]
};
