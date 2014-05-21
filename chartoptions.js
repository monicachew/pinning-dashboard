"use strict";

// Highcharts options.
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
  ]
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
  ]
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
  ]
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
  ]
};
