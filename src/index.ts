'use strict';

import 'bootstrap/js/dist/modal';

import { saveAs } from 'file-saver';
import * as piexif from 'piexif-ts';

import { updateTableHeight, getDateString, dataURLtoBlob, formatTime } from './util';
import { curve } from './chart-curve';
import { dual } from './chart-dual';
import { moon } from './chart-moon';
import { scatter } from './chart-scatter';
import { venus } from './chart-venus';
import { variable, variableFileUpload } from './chart-variable';
import { spectrum, spectrumFileUpload } from './chart-spectrum';
import { pulsar, pulsarFileUpload } from './chart-pulsar';
import { cluster1 } from './chart-cluster';
import { cluster2 } from './chart-cluster2';
import { cluster3 } from './chart-cluster3';
import { round } from './my-math';
import { gravity, gravityFileUpload } from './chart-gravity';

import Chart, { LinearScaleOptions, AnimationSpec, ChartType } from 'chart.js/auto';
import Handsontable from 'handsontable';
import { graphScale } from './chart-cluster-utils/chart-cluster-scatter';
import { clusterFileUpload } from './chart-cluster-utils/chart-cluster-file';

/**
 *  Initializing the page when the website loads
 */
window.onload = function () {
    const chartTypeForm = document.getElementById('chart-type-form') as HTMLFormElement;
    chartTypeForm.onchange = function () {
        chartType((chartTypeForm.elements[0] as HTMLInputElement).value);
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
    const fileUpload = document.getElementById('file-upload') as HTMLButtonElement;
    document.getElementById('file-upload-button').onclick = function () {
        // Clearing the file upload API first by setting it to null, so that uploading actions are 
        // always triggered even if the same file is uploaded again.
        fileUpload.value = null;
        fileUpload.click();
    }

    // Enabling download function. Will trigger Honor Code Pledge interface before
    //  students are allowed to download images.
    document.getElementById('pledge-signed').onclick = () => {
        const honorPledgeForm = document.getElementById('honor-pledge-form') as HTMLFormElement;
        const signature = (honorPledgeForm.elements[0] as HTMLInputElement).value;
        if (signature === null || signature === '') {
            document.getElementById('no-signature-alert').style.display = 'block';
        } else if ('myChart' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            // NO MORE JQUERY BYE BYE xD
            // $('#honor-pledge-modal').modal('hide');
            saveImage(0, signature, true, 1.0);
        } else if ('myChart2' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            // NO MORE JQUERY BYE BYE xD
            // $('#honor-pledge-modal').modal('hide');
            saveImage(1, signature, true, 1.0);
            //combine into one image
            
        } else if ('myChart4' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            // NO MORE JQUERY BYE BYE xD
            // $('#honor-pledge-modal').modal('hide')
            saveImage(2, signature, true, 1.0);

        }
    };

    document.getElementById('save-button').onclick = () => {
        document.getElementById('no-signature-alert').style.display = 'none';
    }

    setChartDefaults();
    chartType((chartTypeForm.elements[0] as HTMLInputElement).value);

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
    //reset myChart object
    if (document.getElementById('myChart') != null) {
        document.getElementById('myChart').remove();
    }
    document.getElementById('chart-div').insertAdjacentHTML('afterbegin', '<canvas id="myChart" width=300 height=200></canvas>\n');
    //remove display of 4 charts
    for (let i = 1; i < 5; i++) {
        let chartId: string = 'myChart'+i.toString()
        let divId: string = 'chart-div'+i.toString()
        if (document.getElementById(divId) != null) {
            if (document.getElementById(chartId) != null) {
                document.getElementById(chartId).remove();
            }
            if (i=== 1 || i ===2)
                document.getElementById(divId).insertAdjacentHTML('afterbegin', '<canvas id= "' + chartId + '" width=428 height=200></canvas>\n');
            else
                document.getElementById(divId).insertAdjacentHTML('afterbegin', '<canvas id= "' + chartId + '" width=300 height=200></canvas>\n');
            document.getElementById(divId).style.display = 'none';
        }
    }

    if (document.getElementById('clusterProForm') != null)
        document.getElementById('clusterProForm').remove()

    //expand the size of axisSet1 and hide axisSet2 for all interfaces
    document.getElementById('axisSet1').className = 'col-sm-12';
    document.getElementById('axisSet2').style.display = 'none';
    document.getElementById('file-upload-button').style.display = 'none';
    document.getElementById('extra-options').innerHTML = '';
    //remove display of 2 axis labels
    for (let i = 0; i < 5; i++) {
        if (document.getElementById('axis-label'+i.toString()) != null) {
            document.getElementById('axis-label'+i.toString()).style.display = 'none';
        }
    }
    // document.getElementById('extra-options').style.display = 'none';
    document.getElementById('table-div').hidden = false;
    document.getElementById('add-row-button').hidden = false;

    document.getElementById('chart-div').style.cursor = "auto"

    let objects: [Handsontable, Chart];
    let cluster_objects: [Handsontable, Chart[], ModelForm, graphScale]


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
            variableFileUpload(evt, objects[0], objects[1] as Chart<'line'>);
        }
    } else if (chart === 'spectrum') {
        objects = spectrum();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            spectrumFileUpload(evt, objects[0]);
        }
    } else if (chart === 'pulsar') {
        objects = pulsar();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            pulsarFileUpload(evt, objects[0], objects[1] as Chart<'line'>);
        }
    } else if (chart === 'cluster1') {
        cluster_objects = cluster1();
        objects = [cluster_objects[0], cluster_objects[1][0]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            clusterFileUpload(evt, cluster_objects[0], cluster_objects[1], cluster_objects[3]);
        }
    } else if (chart === 'cluster2') {
        cluster_objects = cluster2();
        objects = [cluster_objects[0], cluster_objects[1][0]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            clusterFileUpload(evt, cluster_objects[0], cluster_objects[1], cluster_objects[3]);
        }


    } else if (chart === 'cluster3') {
        cluster_objects = cluster3();
        objects = [cluster_objects[0], cluster_objects[1][0]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            clusterFileUpload(evt, cluster_objects[0], cluster_objects[1], cluster_objects[3]);
        }

    }else if (chart === 'gravity') {
        objects = gravity();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            gravityFileUpload(evt, objects[0], objects[1] as Chart<'line'>);
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
    const addRow = document.getElementById('add-row-button');
    addRow.onclick = function () {
        objects[0].alter('insert_row');
    };

    const chartInfoForm = document.getElementById('chart-info-form') as HTMLFormElement;
    chartInfoForm.oninput = function () {
        if (chart === 'cluster2' || chart === 'cluster3') {
            updateChartInfo(cluster_objects[1][0], chartInfoForm)
            updateChartInfo(cluster_objects[1][1], chartInfoForm, 1)
        
        } else {
            updateChartInfo(objects[1], chartInfoForm);
        }
    };
    objects[1].update('none');

}

/**
 *  This function sets the defaults for the Chart.js objects.
 */
function setChartDefaults() {
    // Enable axes labeling
    (Chart.defaults.scale as LinearScaleOptions).title.display = true;
    (Chart.defaults.animation as AnimationSpec<ChartType>).duration = 0;
    Chart.defaults.parsing = false;

    // Setting properties about the title.
    Chart.defaults.plugins.title.display = true;
    Chart.defaults.plugins.title.color = 'rgba(0, 0, 0, 1)';
    Chart.defaults.plugins.title.font.size = 18;
    Chart.defaults.plugins.title.font.weight = 'normal';
    Chart.defaults.plugins.title.font.family = '"Lato", "Arial", sans-serif';

    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    // Disable hiding datasets by clicking their label in the legends.
    Chart.defaults.plugins.legend.onClick = function () { };

    // Setting properties about the tooltip
    Chart.defaults.plugins.tooltip.mode = 'nearest';
    Chart.defaults.plugins.tooltip.callbacks.title = function (): null {
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
function updateChartInfo(myChart: Chart, form: HTMLFormElement, chartNum: number = 0) {
    const elements = form.elements as ChartInfoFormElements;
    let key:string = chartNum === 0 ? "" : (chartNum+1).toString();
    // @ts-ignore
    (myChart.options.scales['x'] as LinearScaleOptions).title.text = elements['x'+key+'Axis'].value;
    // @ts-ignore
    (myChart.options.scales['y'] as LinearScaleOptions).title.text = elements['y'+key+'Axis'].value;
    myChart.options.plugins.title.text = elements['title'].value;
    const labels = elements['data'].value.split(',').map((item: string) => item.trim());
    let p = 0;
    for (let i = 0; p < labels.length && i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].hidden && !myChart.data.datasets[i].immutableLabel) {
            myChart.data.datasets[i].label = labels[p++];
        }
    }
    myChart.update('none');
}

function saveImage(chartNum: number, signature: string, jpg = true, quality = 1.0) {
    if (chartNum === 0) {
        const canvas = document.getElementById('myChart') as HTMLCanvasElement;
            // Create a dummy canvas
    const destCanvas = document.createElement('canvas');
    destCanvas.width = canvas.width;
    destCanvas.height = canvas.height;

    const destCtx = destCanvas.getContext('2d');

    // Create a rectangle with the desired color
    destCtx.fillStyle = '#FFFFFF';
    destCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the original canvas onto the destination canvas
    destCtx.drawImage(canvas, 0, 0);

    // Download the dummy canvas
    const time = getDateString();
    if (jpg) {
        const exifImage = addEXIFToImage(destCanvas.toDataURL('image/jpeg', quality), signature, time);
        //create image
        saveAs(dataURLtoBlob(exifImage), 'chart-' + formatTime(time) + '.jpg');
    } else {
        console.log('Only jpg export is supported for EXIF info.');
    }
    } else if (chartNum === 1) {
        const canvas = document.getElementById('myChart1') as HTMLCanvasElement;
        const canvas2 = document.getElementById('myChart2') as HTMLCanvasElement;
        // Create a dummy canvas
            // Create a dummy canvas
    const destCanvas = document.createElement('canvas');
    destCanvas.width = 2 * canvas.width;
    destCanvas.height = canvas.height;

    const destCtx = destCanvas.getContext('2d');

    // Create a rectangle with the desired color
    destCtx.fillStyle = '#FFFFFF';
    destCtx.fillRect(0, 0, 2* canvas.width, canvas.height);

    // Draw the original canvas onto the destination canvas
    let compile = destCtx.drawImage(canvas, 0, 0);
    //draw canvas 2 onto the destination canvas
    compile = destCtx.drawImage(canvas2, canvas.width, 0);


    // Download the dummy canvas
    const time = getDateString();
    if (jpg) {
        const exifImage = addEXIFToImage(destCanvas.toDataURL('image/jpeg', quality), signature, time);
        //create image
        saveAs(dataURLtoBlob(exifImage), 'chart-' + formatTime(time) + '.jpg');
    } else {
        console.log('Only jpg export is supported for EXIF info.');
    }
    } else if (chartNum === 2) {
        const canvas = document.getElementById('myChart1') as HTMLCanvasElement;
        const canvas2 = document.getElementById('myChart2') as HTMLCanvasElement;
        const canvas3 = document.getElementById('myChart3') as HTMLCanvasElement;
        const canvas4 = document.getElementById('myChart4') as HTMLCanvasElement;
        // Create a dummy canvas
            // Create a dummy canvas
    const destCanvas = document.createElement('canvas');
    destCanvas.width = 2 * canvas.width;
    destCanvas.height = 2 * canvas.height;

    const destCtx = destCanvas.getContext('2d');

    // Create a rectangle with the desired color
    destCtx.fillStyle = '#FFFFFF';
    destCtx.fillRect(0, 0, 2* canvas.width, 2* canvas.height);

    // Draw the original canvas onto the destination canvas
    let compile = destCtx.drawImage(canvas, 0, 0);
    //draw canvas 2 onto the destination canvas
    compile = destCtx.drawImage(canvas2, canvas.width, 0);
    //draw canvas 3 onto the destination canvas
    compile = destCtx.drawImage(canvas3, 0, canvas.height);
    //draw canvas 4 onto the destination canvas
    compile = destCtx.drawImage(canvas4, canvas.width, canvas.height);



    // Download the dummy canvas
    const time = getDateString();
    if (jpg) {
        const exifImage = addEXIFToImage(destCanvas.toDataURL('image/jpeg', quality), signature, time);
        //create image
        saveAs(dataURLtoBlob(exifImage), 'chart-' + formatTime(time) + '.jpg');
    } else {
        console.log('Only jpg export is supported for EXIF info.');
    }
    }
}

function addEXIFToImage(jpegData: string, signature: string, time: string) {
    const zeroth: piexif.IExifElement = {};
    const exif: piexif.IExifElement = {};
    zeroth[piexif.TagValues.ImageIFD.Artist] = signature;
    exif[piexif.TagValues.ExifIFD.DateTimeOriginal] = time;

    const exifObj = { '0th': zeroth, 'Exif': exif };
    const exifBytes = piexif.dump(exifObj);
    return piexif.insert(exifBytes, jpegData);
}