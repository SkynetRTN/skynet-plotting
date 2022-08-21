'use strict';

import Chart from "chart.js/auto";
import { ChartConfiguration, LinearScaleOptions, ScatterDataPoint } from "chart.js";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config";
import { updateLabels, updateTableHeight, linkInputs, throttle } from "./util";

/**
 *  Function for scatter chart.
 *  @returns {[Handsontable, Chart]}
 */
export function scatter(): [Handsontable, Chart] {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Scatter" id="scatter-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Distance (kpc): </div>\n' +
        '<div class="col-sm-4 range"><input type="range" name="x" title="Center (X)" value="0"></input></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Center (x)" name="x_num" class="spinboxnum field" value="0"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Diameter (kpc): </div>\n' +
        '<div class="col-sm-4 range"><input type="range" name="d" title="Diameter" value="10"></input></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Diameter" name="d_num" class="spinboxnum field" value="10"></div>\n' +
        '</div>\n' +
        '</form>\n'
    );
    const scatterForm = document.getElementById("scatter-form") as ScatterForm;
    linkInputs(scatterForm.elements['d'], scatterForm.elements['d_num'], 0, 50, 0.01, 10, false, true, 0, Number.POSITIVE_INFINITY);
    linkInputs(scatterForm.elements['x'], scatterForm.elements['x_num'], 0, 20, 0.01, 0, false, true, 0, Number.POSITIVE_INFINITY);

    const tableData: any[] = [];
    for (let i = 0; i < 15; i++) {
        tableData.push({
            'lo': Math.random() * 40.0 - 20.0,
            'la': Math.random() * 40.0 - 20.0,
            'di': Math.random() * 20.0,
        });
    }

    const container = document.getElementById('table-div');
          // unhide table whenever interface is selected
  document.getElementById("chart-type-form").addEventListener("click", () => {
    container.style.display = "block";
    document.getElementById('add-row-button').hidden = false;
    document.getElementById('file-upload-button').hidden = false;
    });
    const tableOptions: Handsontable.GridSettings = {
        data: tableData,
        colHeaders: ['Longitude', 'Latitude', 'Distance'],
        maxCols: 3,
        columns: [
            { data: 'lo', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'la', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'di', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    };
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y Axis";
    const hot = new Handsontable(container, { ...tableCommonOptions, ...tableOptions });

    const chartOptions: ChartConfiguration = {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Sun',
                    data: [{ x: 0, y: 0 }],
                    backgroundColor: colors['bright'],
                    fill: false,
                    showLine: false,
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                }, {
                    label: 'Data',
                    data: [],
                    backgroundColor: colors['orange'],
                    fill: false,
                    showLine: false,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: false,
                }, {
                    pointStyle: 'crossRot',
                    data: [{ x: 0, y: 0 }],
                    fill: false,
                    showLine: false,
                    borderWidth: 5,
                    immutableLabel: true,
                    pointRadius: 10,
                    pointHoverRadius: 12,
                }, {
                    label: 'Model',
                    data: circle(0, 0, 10),
                    parsing: {
                        xAxisKey: 'x',
                        yAxisKey: 'y'
                    },
                    borderColor: colors['gray'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true
                }
            ],
             
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            plugins: {
                legend: {
                    labels: {
                        filter: function (legendItem) {
                            return legendItem.datasetIndex !== 2;
                        }
                    }
                },
                tooltip: {
                    filter: function (tooltipItem) {
                        return tooltipItem.datasetIndex !== 3;
                    },
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    };

    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    const myChart = new Chart(ctx, chartOptions) as Chart<'line'>;

    const update = function () {
        updateScatter(tableData, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    // Link the form to chart
    //const scatterForm = document.getElementById("scatter-form");
    const scatterOninput = function () {
        let x = parseFloat(this.elements['x_num'].value);
        let y = 0;
        let d = parseFloat(this.elements['d_num'].value);
        myChart.data.datasets[2].data = [{ x: x, y: y }];
        myChart.data.datasets[3].data = circle(x, y, d);
        myChart.update('none');
    }
    scatterForm.oninput = throttle(scatterOninput, 10);

    updateScatter(tableData, myChart);

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = "x";
    myChart.options.scales['y'].title.text = "y";
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);

    return [hot, myChart];
}

/**
 *  This function is similar to updateLine but transforms longitude, latitude and distance to x and y
 *  coordinates to be rendered in the chart.
 *  @param tableData:   The dictionary object holding longitude, latitude and distance
 *  @param myChart: The Chartjs object to be updated.
 */
function updateScatter(tableData: any[], myChart: Chart) {
    let start = 0;

    // The initial value of mins and maxs are 0 becaues the Sun is located at (0, 0)
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    let chart = myChart.data.datasets[1].data as ScatterDataPoint[];
    for (let i = 0; i < tableData.length; i++) {
        const lo = tableData[i]['lo'];
        const la = tableData[i]['la'];
        const di = tableData[i]['di'];
        if (la === '' || lo === '' || di === '' ||
            la === null || lo === null || di === null) {
            continue;
        }
        chart[start++] = {
            x: Math.cos(la / 180 * Math.PI) * di * Math.cos(lo / 180 * Math.PI),
            y: Math.cos(la / 180 * Math.PI) * di * Math.sin(lo / 180 * Math.PI),
        };

        minX = Math.min(chart[start - 1].x, minX);
        maxX = Math.max(chart[start - 1].x, maxX);
        minY = Math.min(chart[start - 1].y, minY);
        maxY = Math.max(chart[start - 1].y, maxY);
    }
    while (chart.length !== start) {
        chart.pop();
    }

    adjustScale(myChart, minX, maxX, minY, maxY, false);
}

/**
 * Adjust the min/max scales of the chart by given new min/max values.
 * @param {Chart} myChart The chart to be updated
 * @param {number} minX 
 * @param {number} maxX 
 * @param {number} minY 
 * @param {number} maxY 
 * @param {boolean} suggested       Default is false. If true, min/max values won't be
 * updated if new values are greater (for min) or less (for max) than the existing values.
 */
function adjustScale(myChart: Chart, minX: number, maxX: number, minY: number, maxY: number, suggested: boolean = false) {
    // Adjusting the min/max values to avoid having data points on the very edge
    minX -= 3;
    maxX += 3;
    minY -= 3;
    maxY += 3;

    // This is the ratio of the length of X axis over the length of Y axis
    const screenRatio = 1.9;
    let dataRatio = (maxX - minX) / (maxY - minY);

    if (dataRatio < screenRatio) {
        let m = (maxX + minX) / 2;
        let d = (maxX - minX) / 2;
        maxX = m + d / dataRatio * screenRatio;
        minX = m - d / dataRatio * screenRatio;
    } else {
        let m = (maxY + minY) / 2;
        let d = (maxY - minY) / 2;
        maxY = m + d * dataRatio / screenRatio;
        minY = m - d * dataRatio / screenRatio;
    }

    if (suggested) {
        minX = Math.min(minX, myChart.options.scales['x'].min);
        maxX = Math.max(maxX, myChart.options.scales['x'].max);
        minY = Math.min(minY, myChart.options.scales['y'].min);
        maxY = Math.max(maxY, myChart.options.scales['y'].max);
    }

    myChart.options.scales['x'].min = Math.floor(minX);
    myChart.options.scales['x'].max = Math.ceil(maxX);
    myChart.options.scales['y'].min = Math.floor(minY);
    myChart.options.scales['y'].max = Math.ceil(maxY);
    (myChart.options.scales['x'] as LinearScaleOptions).ticks.stepSize = Math.ceil((maxY - minY) / 7);
    (myChart.options.scales['y'] as LinearScaleOptions).ticks.stepSize = Math.ceil((maxY - minY) / 7);

    myChart.update('none');
}

/**
 * Generator function for the circle with specificed x, y and diameter
 * @param {number} x        x-coordinate of the center of circle
 * @param {number} y        y-coordinate of the centor of circle
 * @param {number} diameter   diameter of the circle
 * @param {number} steps    Number of points to generate. Default is 500
 * @returns {Array}         An array of points
 */
function circle(x: number, y: number, diameter: number, steps: number = 500): ScatterDataPoint[] {
    let data: ScatterDataPoint[] = [];

    let step = 2 * Math.PI / steps;
    for (let i = 0; i < steps; i++) {
        data.push({
            x: x + Math.cos(step * i) * (diameter / 2),
            y: y + Math.sin(step * i) * (diameter / 2)
        });
    }
    // Add a redundant point to complete the circle.
    data.push({
        x: x + (diameter / 2),
        y: y
    })

    return data;
}
