'use strict';

import { updateTableHeight } from "./shared-util.js";
import { round } from "./my-math.mjs";
import { curve } from "./chart-curve.js";
import { dual } from "./chart-dual.js";
import { moon } from "./chart-moon.js";
import { scatter } from "./chart-scatter.js";
import { venus } from "./chart-venus.js";
import { variable, variableFileUpload } from "./chart-variable.js";

/**
 *  Initializing the page when the website loads
 */
window.onload = function () {
    let form = document.getElementById('chart-type-form');
    form.onchange = function () {
        chartType(form.elements['chart'].value);
    };
    chartType(form.elements['chart'].value);

    // Adding 'toBlob' function to Microsoft Edge. Required for downloading.
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {
                let dataURL = this.toDataURL(type, quality).split(',')[1];
                setTimeout(function () {
                    let binStr = atob(dataURL),
                        len = binStr.length,
                        arr = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        arr[i] = binStr.charCodeAt(i);
                    }
                    callback(new Blob([arr], { type: type || 'image/png' }));
                });
            }
        });
    }

    // Enabling CSV upload function
    let fileUpload = this.document.getElementById('file-upload');
    document.getElementById('file-upload-button').onclick = function () {
        fileUpload.value = null;
        fileUpload.click();
    }

    // Enabling download function
    document.getElementById('save-button').onclick = function () {
        let canvas = document.getElementById('myChart');

        // Create a dummy canvas
        let destCanvas = document.createElement("canvas");
        destCanvas.width = canvas.width;
        destCanvas.height = canvas.height;

        let destCtx = destCanvas.getContext('2d');

        // Create a rectangle with the desired color
        destCtx.fillStyle = "#FFFFFF";
        destCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the original canvas onto the destination canvas
        destCtx.drawImage(canvas, 0, 0);

        // Download the dummy canvas
        destCanvas.toBlob(function (blob) {
            saveAs(blob, "chart.jpg");
        }, 'image/jpeg', 0.3);
    };

    document.getElementById('save-png').onclick = function () {
        let canvas = document.getElementById('myChart');

        // Create a dummy canvas
        let destCanvas = document.createElement("canvas");
        destCanvas.width = canvas.width;
        destCanvas.height = canvas.height;

        let destCtx = destCanvas.getContext('2d');

        // Create a rectangle with the desired color
        destCtx.fillStyle = "#FFFFFF";
        destCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the original canvas onto the destination canvas
        destCtx.drawImage(canvas, 0, 0);

        // Download the dummy canvas
        destCanvas.toBlob(function (blob) {
            saveAs(blob, "chart.png");
        }, 'image/png');
    };
};

/**
 *  This function runs once each time the type of the chart changes. It resets various parts of the page
 *  (input field, table, and the chart) and initialize the components.
 *  @param chart:   A string represents the type of chart to be rendered. This string comes from the
 *                  chart-type-form
 */
function chartType(chart) {
    // rewrite HTML content of table & chart
    document.getElementById('input-div').innerHTML = '';
    document.getElementById('table-div').innerHTML = '';
    document.getElementById("chart-div").innerHTML =
        '<canvas id="myChart" width="300" height="200"></canvas>\n';
    document.getElementById("file-upload-button").style.display = "none";
    document.getElementById('table-div').hidden = false;
    document.getElementById("add-row-button").hidden = false;

    let objects;

    if (chart === "curve") {
        objects = curve();
    } else if (chart === "moon") {
        objects = moon();
    } else if (chart === "scatter") {
        objects = scatter();
    } else if (chart === "venus") {
        objects = venus();
    } else if (chart === "dual") {
        objects = dual();
    } else {
        objects = variable();
        document.getElementById("file-upload-button").style.display = "inline";
        document.getElementById("file-upload").onchange = function (evt) {
            variableFileUpload(evt, objects[0], objects[1]);
        }
    }

    updateTableHeight(objects[0]);
    initializeChart(objects[1], objects[0]);

    /**
     *  TODO: Find a way to align add-row-button while still putting it directly below
     *  the table element, so that in smaller screen it will be next to the table instead
     *  of being under the chart with the save-button.
     */
    let addRow = document.getElementById('add-row-button');
    addRow.onclick = function () {
        objects[0].alter('insert_row');
    };

    let chartInfoForm = document.getElementById('chart-info-form');
    chartInfoForm.oninput = function () {
        updateChartInfo(objects[1], chartInfoForm);
    };
    updateChartInfo(objects[1], chartInfoForm);

}

/**
 *  This function initializes some settings for the chart and table objects. It runs once with chartType
 *  each time the type of chart changes
 *  @param chart:   The Chartjs object
 *  @param table:   The Handsontable object
 */
function initializeChart(chart, table) {
    // Setting properties about the title.
    chart.options.title.display = true;
    chart.options.title.fontSize = 18;
    chart.options.title.fontColor = "rgba(0, 0, 0, 1)";
    chart.options.title.fontStyle = '';
    chart.options.title.fontFamily = "'Lato', 'Arial', sans-serif";

    // Setting properties about the tooltips
    chart.options.tooltips.mode = 'nearest';
    chart.options.tooltips.callbacks.title = function (tooltipItems, data) {
        return null;
    };
    // chart.options.tooltips.callbacks.label = function (tooltipItem, data) {
    //     return '(' + round(tooltipItem.xLabel, 2) + ', ' +
    //         round(tooltipItem.yLabel, 2) + ')';
    // };

    // Disable hiding datasets by clicking their label in the legends.
    chart.options.legend.onClick = function (e) {
        e.stopPropagation();
    };

    // Enable axes labeling
    chart.options.scales.xAxes[0].scaleLabel.display = true;
    chart.options.scales.yAxes[0].scaleLabel.display = true;

    // Update the height of the table when the chart resizes.
    chart.options.onResize = function () {
        updateTableHeight(table);
    }
}

/**
 *  This function takes a Chartjs object and a form containing information (Title, data labels, X axis label,
 *  Y axis label) about the chart, and updates corresponding properties of the chart.
 *  @param myChart: The Chartjs object to be updated.
 *  @param form:    The form containing information about the chart.
 */
function updateChartInfo(myChart, form) {
    myChart.options.title.text = form.elements['title'].value;
    let labels = form.elements['data'].value.split(",").map(item => item.trim());
    for (let i = 0; i < labels.length && i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].immutableLabel) {
            myChart.data.datasets[i].label = labels[i];
        }
    }
    myChart.options.scales.xAxes[0].scaleLabel.labelString = form.elements['xAxis'].value;
    myChart.options.scales.yAxes[0].scaleLabel.labelString = form.elements['yAxis'].value;
    myChart.update(0);
}

