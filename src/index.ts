'use strict';

import 'bootstrap/js/dist/modal';

import { saveAs } from 'file-saver';
import * as piexif from 'piexif-ts';

import { updateTableHeight, getDateString, dataURLtoBlob, formatTime, defaultLayout, percentToAbsolute } from './util';
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
import { cluster3p } from "./chart-cluster3plus";
import { round } from './my-math';
import { gravity, gravityClass, gravityFileUpload } from './chart-gravity';
import { gravityPro, gravityProFileUpload } from './chart-gravitypro';
import Chart, { LinearScaleOptions, AnimationSpec, ChartType } from 'chart.js/auto';
import Handsontable from 'handsontable';
import { pause } from './sonification';
import { TransientChart } from './chart-transient-utils/chart-transient-chart';
import { clusterFileUpload } from "./chart-cluster-utils/chart-cluster-file";
import { graphScale } from "./chart-cluster-utils/chart-cluster-scatter";
import { updateClusterProLabels } from "./chart-cluster-utils/chart-cluster-interface";
import { radio } from './chart-radio'
import {transient, transientFileUpload} from "./chart-transient";
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
        }
        else if ('myChart' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            // NO MORE JQUERY BYE BYE xD
            // $('#honor-pledge-modal').modal('hide');
            saveImage([], signature, true, 1.0);
        }
        // for cluster two
        else if ('myChart1' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            saveImage([1, 2], signature, true, 1.0);
            // for cluster pro
        } else if ('myChart3' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            saveImage([3, 4, 2], signature, true, 1.0);
        } else if ('myChart3p' in window) {
            document.getElementById('no-signature-alert').style.display = 'none';
            saveImage([3, 4, 2], signature, true, 1.0, true);
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
    defaultLayout()
    let objects: [Handsontable, Chart];
    let grav_objects: [Handsontable, Chart, gravityClass]
    let cluster_objects: [Handsontable, Chart[], ClusterForm, graphScale]
    // let gravpro_objects: [Handsontable, Chart[], gravityClass]


    if (chart === 'curve') {
        objects = curve();
    } else if (chart === 'moon') {
        objects = moon();
    } else if (chart === 'radio') {
        objects = radio();
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
    }  else if (chart === 'pulsar') {
        objects = pulsar();
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            pulsarFileUpload(evt, objects[0], objects[1] as Chart<'line'>);
        }
    // } else if (chart === 'cluster0') {
    //     cluster_objects = cluster0();
    //     objects = [cluster_objects[0], cluster_objects[1][0]]
    //     document.getElementById('file-upload-button').style.display = 'inline';
    //     document.getElementById('file-upload').onchange = function (evt) {
    //         clusterFileUpload(evt, cluster_objects[0], cluster_objects[1], cluster_objects[3]);
    //     }
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
        let result = cluster3()
        cluster_objects = [result[0], result[1], result[2], result[3]];
        objects = [cluster_objects[0], cluster_objects[1][0]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            clusterFileUpload(evt, cluster_objects[0], cluster_objects[1], cluster_objects[3], true, result[4]);
        }

    } else if (chart === 'cluster3p') {
        let result = cluster3p()
        cluster_objects = [result[0], result[1], result[2], result[3]];
        objects = [cluster_objects[0], cluster_objects[1][0]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            clusterFileUpload(evt, cluster_objects[0], cluster_objects[1], cluster_objects[3], true, result[4]);
        }
    } else if (chart === 'gravity') {
        grav_objects = gravity();
        objects = [grav_objects[0], grav_objects[1]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            gravityFileUpload(evt, objects[0], objects[1] as Chart<'line'>, grav_objects[2]);
        }
    } else if (chart === 'gravityPro') {
        let grav_pro_objects = gravityPro();
        objects = [grav_pro_objects[0], grav_pro_objects[1][0]]
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            gravityProFileUpload(evt, grav_pro_objects[0], grav_pro_objects[1] as Chart<'line'>[], grav_pro_objects[2]);
        }

    } else if (chart === 'transient') {
        let transientObjects: [Handsontable, TransientChart];
        transientObjects = transient();
        objects = [transientObjects[0], transientObjects[1].chart];
        document.getElementById('file-upload-button').style.display = 'inline';
        document.getElementById('file-upload').onchange = function (evt) {
            transientFileUpload(evt, transientObjects[0], transientObjects[1]);
        }
    }
    if (chart !== 'radio'){
        updateTableHeight(objects[0]);
        // Update the height of the table when the chart resizes.
        objects[1].options.onResize = function () {
            updateTableHeight(objects[0]);
        }
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
        } else if (chart === 'cluster3p') {
            updateClusterProLabels([cluster_objects[1][0], cluster_objects[1][1]])
        } else if (chart !== 'transient') {
            updateChartInfo(objects[1], chartInfoForm);
        }
    };

    if (chart !== 'radio') {
        if (objects[1].data.sonification) {
            document.getElementById('chart-type-form').onchange = function () {
                pause(objects[1]);
                chartType(((document.getElementById('chart-type-form') as HTMLFormElement).elements[0] as HTMLInputElement).value);
            };
        }
        objects[1].update('none');
    }
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
 * @param chartNum
 */
function updateChartInfo(myChart: Chart, form: HTMLFormElement, chartNum: number = 0) {
    const elements = form.elements as ChartInfoFormElements;
    let key: string = chartNum === 0 ? "" : (chartNum).toString();
    // @ts-ignore
    (myChart.options.scales['x'] as LinearScaleOptions).title.text = elements['x' + key + 'Axis'].value;
    // @ts-ignore
    (myChart.options.scales['y'] as LinearScaleOptions).title.text = elements['y' + key + 'Axis'].value;
    myChart.options.plugins.title.text = elements['title'].value;
    updateChartDataLabel(myChart, form);
    myChart.update('none');
}

export function updateChartDataLabel(myChart: Chart, form: HTMLFormElement) {
    const elements = form.elements as ChartInfoFormElements;
    const labels = elements['data'].value.split(',').map((item: string) => item.trim());
    let p = 0;
    for (let i = 0; p < labels.length && i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].hidden && !myChart.data.datasets[i].immutableLabel) {
            myChart.data.datasets[i].label = labels[p++];
        }
    }
}

function saveImage(chartNums: any[], signature: string, jpg = true, quality = 1.0, isCluster3p: boolean = false) {
    const destCanvas = document.createElement('canvas');
    destCanvas.width = 0;
    destCanvas.height = 0;
    chartNums = chartNums.length === 0 ? [''] : chartNums;
    const canvases: HTMLCanvasElement[] = [];
    for (let c = 0; c < chartNums.length; c++) {
        const graphName = 'myChart' + chartNums[c].toString();
        const canvas = document.getElementById(graphName) as HTMLCanvasElement;
        destCanvas.width += canvas.width;
        destCanvas.height = destCanvas.height < canvas.height ? canvas.height : destCanvas.height;
        canvases.push(canvas);
    }

    const destCtx = destCanvas.getContext('2d');
    // Create a rectangle with the desired color
    destCtx.fillStyle = '#FFFFFF';
    destCtx.fillRect(0, 0, destCanvas.width, destCanvas.height);
    let dx = 0;
    canvases.forEach((canvas) => {
        // Draw the original canvas onto the destination canvas
        destCtx.drawImage(canvas, dx, 0);
        dx += canvas.width;
    })

    if (isCluster3p) {
        const proMotionForm = document.getElementById('clusterProForm') as ClusterProForm;
        const clusterForm = document.getElementById('cluster-form') as ClusterForm;
        let texts = [];
        if (JSON.parse(proMotionForm['rarangeCheck'].checked))
            texts.push("Motion in RA: " + proMotionForm['ramotion_num'].value
                + " ± " + proMotionForm['rarange_num'].value + " mas/yr");
        if (JSON.parse(proMotionForm['decrangeCheck'].checked))
            texts.push("Motion in DEC: " + proMotionForm['decmotion_num'].value
                + " ± " + proMotionForm['decrange_num'].value + " mas/yr");
        if (JSON.parse(clusterForm['distrangeCheck'].checked))
            texts.push("Distance: " + clusterForm['d_num'].value
                + " ± " + percentToAbsolute(clusterForm['d_num'].value, clusterForm['distrange'].value) + " kpc");
        texts.push("log(Age): " + clusterForm['age_num'].value + " log(yr)");
        texts.push("Metallicity: " + clusterForm['metal'].value + " solar");
        texts.push("E(B-V): " + clusterForm['red_num'].value + ' mag');
        texts.push("R_V: " + clusterForm['rv_num'].value)

        dx -= canvases[canvases.length - 1].width;
        let dy = canvases[canvases.length - 1].height;
        destCtx.font = '24px serif';
        destCtx.fillStyle = 'black'
        for (const text of texts) {
            dy += 30
            destCtx.fillText(text, dx + 20, dy);
        }
    }

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

function addEXIFToImage(jpegData: string, signature: string, time: string) {
    const zeroth: piexif.IExifElement = {};
    const exif: piexif.IExifElement = {};
    zeroth[piexif.TagValues.ImageIFD.Artist] = signature;
    exif[piexif.TagValues.ExifIFD.DateTimeOriginal] = time;

    const exifObj = { '0th': zeroth, 'Exif': exif };
    const exifBytes = piexif.dump(exifObj);
    return piexif.insert(exifBytes, jpegData);
}
