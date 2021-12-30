'use strict';

/**
 * "importing for side effect": nothing is actually imported by the line below. 
 * This is used to attach the bootstrap modal plugin to the global jQuery object.
 */ 
import * as $ from 'jquery';
import 'bootstrap/js/dist/modal';

import { saveAs } from 'file-saver';
import * as piexif from 'piexif-ts';

import { updateTableHeight, getDateString, dataURLtoBlob, formatTime } from './util.js';
import { curve } from './chart-curve.js';
import { dual } from './chart-dual.js';
import { moon } from './chart-moon.js';
import { scatter } from './chart-scatter.js';
import { venus } from './chart-venus.js';
import { variable, variableFileUpload } from './chart-variable.js';
import { spectrum, spectrumFileUpload } from './chart-spectrum.js';
import { pulsar, pulsarFileUpload } from './chart-pulsar.js';
import { cluster, clusterFileUpload } from './chart-cluster.js';
import { round } from './my-math';

import Chart from 'chart.js/auto';
import Handsontable from 'handsontable';

/**
 *  Initializing the page when the website loads
 */
window.onload = function () {
    let form = document.getElementById('chart-type-form') as HTMLFormElement;
    form.onchange = function () {
        chartType((form.elements[0] as HTMLInputElement).value);
    };

    // Adding 'toBlob' function to Microsoft Edge. Required for downloading.
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback: Function, type: string, quality: number) {
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
    let fileUpload = document.getElementById('file-upload') as HTMLButtonElement;
    document.getElementById('file-upload-button').onclick = function () {
        // Clearing the file upload API first by setting it to null, so that uploading actions are 
        // always triggered even if the same file is uploaded again.
        fileUpload.value = null;
        fileUpload.click();
    }

    // Enabling download function. Will trigger Honor Code Pledge interface before
    //  students are allowed to download images.
    document.getElementById('pledge-signed').onclick = () => {
        let honorPledgeForm = document.getElementById('honor-pledge-form') as HTMLFormElement;
        let signature = (honorPledgeForm.elements[0] as HTMLInputElement).value;
        if (signature === null || signature === '') {
            document.getElementById('no-signature-alert').style.display = 'block';
        } else {
            document.getElementById('no-signature-alert').style.display = 'none';
            // jQuery is required for this line of bootstrap functionality to work
            $('#honor-pledge-modal').modal('hide');
            saveImage('myChart', signature, true, 1.0);
        }
    };

    document.getElementById('save-button').onclick = () => {
        document.getElementById('no-signature-alert').style.display = 'none';
    }

    setChartDefaults();
    chartType((form.elements[0] as HTMLInputElement).value);
};

/**
 *  This function runs once each time the type of the chart changes. It resets various parts of the page
 *  (input field, table, and the chart) and initialize the components.
 *  @param chart:   A string represents the type of chart to be rendered. This string comes from the
 *                  chart-type-form
 */
function chartType(chart: string) {
    // rewrite HTML content of table & chart
    document.getElementById('input-div').innerHTML = '';
    document.getElementById('table-div').innerHTML = '';
    document.getElementById('chart-div').innerHTML =
        '<canvas id="myChart" width=300 height=200></canvas>\n';
    document.getElementById('file-upload-button').style.display = 'none';
    document.getElementById('table-div').hidden = false;
    document.getElementById('add-row-button').hidden = false;

    let objects: [Handsontable, Chart];

    if (chart === 'curve') {
        objects = curve();
    } else if (chart === 'moon') {
        objects = moon();
    } else if (chart === 'scatter') {
        objects = scatter();
    } else if (chart === 'venus') {
        objects = venus();
    } else if (chart === 'dual') {
        objects = dual();
    } else if (chart === 'variable') {
        objects = variable();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            variableFileUpload(evt, objects[0], objects[1]);
        }
    } else if (chart === 'spectrum') {
        objects = spectrum();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            spectrumFileUpload(evt, objects[0], objects[1]);
        }
    } else if (chart === 'pulsar') {
        objects = pulsar();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            pulsarFileUpload(evt, objects[0], objects[1]);
        }
    } else if (chart === 'cluster') {
        objects = cluster();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            clusterFileUpload(evt, objects[0], objects[1]);
        }
    }

    updateTableHeight(objects[0]);
    // Update the height of the table when the chart resizes.
    objects[1].options.onResize = function () {
        updateTableHeight(objects[0]);
    }

    /**
     *  TODO: Find a way to align add-row-button while still putting it directly below
     *  the table element, so that in smaller screen it will be next to the table instead
     *  of being under the chart with the save-button.
     */
    let addRow = document.getElementById('add-row-button');
    addRow.onclick = function () {
        objects[0].alter('insert_row');
    };

    let chartInfoForm = document.getElementById('chart-info-form') as HTMLFormElement;
    chartInfoForm.oninput = function () {
        updateChartInfo(objects[1], chartInfoForm);
    };
    objects[1].update('none');

}

/**
 *  This function sets the defaults for the Chart.js objects.
 */
function setChartDefaults() {
    // Enable axes labeling
    Chart.defaults.scale.title.display = true;
    Chart.defaults.animation.duration = 0;
    Chart.defaults.parsing = false;
    
    // Setting properties about the title.
    Chart.defaults.plugins.title.display = true;
    Chart.defaults.plugins.title.font.size = 18;
    Chart.defaults.plugins.title.font.weight = 'normal';
    Chart.defaults.plugins.title.font.family = '"Lato", "Arial", sans-serif';

    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    // Disable hiding datasets by clicking their label in the legends.
    Chart.defaults.plugins.legend.onClick = function () {};

    // Setting properties about the tooltip
    Chart.defaults.plugins.tooltip.mode = 'nearest';
    Chart.defaults.plugins.tooltip.callbacks.title = function (context): null {
        return null;
    };
    Chart.defaults.plugins.tooltip.callbacks.label = function (context) {
        return '(' + round(context.parsed.x, 2) + ', ' +
            round(context.parsed.y, 2) + ')';
    }
}

/**
 *  This function takes a Chartjs object and a form containing information (Title, data labels, X axis label,
 *  Y axis label) about the chart, and updates corresponding properties of the chart.
 *  DATA FLOW: chart-info-form -> Chart
 *  @param myChart: The Chartjs object to be updated.
 *  @param form:    The form containing information about the chart.
 */
function updateChartInfo(myChart: Chart, form: HTMLFormElement) {
    let elements = form.elements as ChartInfoFormElements;
    myChart.options.plugins.title.text = elements['title'].value;
    let labels = elements['data'].value.split(',').map((item: string) => item.trim());
    let p = 0;
    for (let i = 0; p < labels.length && i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].hidden && !myChart.data.datasets[i].immutableLabel) {
            myChart.data.datasets[i].label = labels[p++];
        }
    }
    myChart.options.scales['x'].title.text = elements['xAxis'].value;
    myChart.options.scales['y'].title.text = elements['yAxis'].value;
    myChart.update('none');
}

function saveImage(canvasID: string, signature: string, jpg=true, quality=1.0) {
    let canvas = document.getElementById(canvasID) as HTMLCanvasElement;

    // Create a dummy canvas
    let destCanvas = document.createElement('canvas');
    destCanvas.width = canvas.width;
    destCanvas.height = canvas.height;

    let destCtx = destCanvas.getContext('2d');

    // Create a rectangle with the desired color
    destCtx.fillStyle = '#FFFFFF';
    destCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the original canvas onto the destination canvas
    destCtx.drawImage(canvas, 0, 0);

    // Download the dummy canvas
    let time = getDateString();
    let exifImage = addEXIFToImage(destCanvas.toDataURL('image/jpeg', 1.0), signature, time);
    saveAs(dataURLtoBlob(exifImage), 'chart-'+formatTime(time)+'.jpg');
}

function addEXIFToImage(jpegData: string, signature: string, time: string) {
    let zeroth: piexif.IExifElement;
    let exif: piexif.IExifElement;
    zeroth[piexif.TagValues.ImageIFD.Artist] = signature;
    exif[piexif.TagValues.ExifIFD.DateTimeOriginal] = time;
    
    let exifObj = { '0th': zeroth, 'Exif': exif };
    let exifBytes = piexif.dump(exifObj);
    return piexif.insert(exifBytes, jpegData);
}