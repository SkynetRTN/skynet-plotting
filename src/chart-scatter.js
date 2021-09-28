'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLabels, updateTableHeight } from "./util.js"
import { rad, round } from "./my-math.js"

/**
 *  Function for scatter chart.
 *  @returns {any[]}
 */
export function scatter() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Scatter" id="scatter-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6">Center (X): </div>\n' +
        '<div class="col-sm-6"><input class="field" type="number" step="0.001" name="x" title="Center (X)" value=0></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6">Center (Y): </div>\n' +
        '<div class="col-sm-6"><input class="field" type="number" step="0.001" name="y" title="Center (Y)" value=0></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6">Radius: </div>\n' +
        '<div class="col-sm-6"><input class="field" type="number" step="0.001" name="r" title="Radius" value=5></input></div>\n' +
        '</div>\n' +
        '</form>\n'
    );

    let tableData = [];
    for (let i = 0; i < 17; i++) {
        tableData[i] = {
            'lo': Math.random() * 40.0 - 20.0,
            'la': Math.random() * 40.0 - 20.0,
            'di': Math.random() * 20.0,
        };
    }

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Longitude', 'Latitude', 'Distance'],
        maxCols: 3,
        columns: [
            { data: 'lo', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'la', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'di', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: chartData,
                    backgroundColor: colors['orange'],
                    fill: false,
                    showLine: false,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: false,
                }, {
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
                    pointStyle: 'crossRot',
                    data: [{ x: 0, y: 0 }],
                    fill: false,
                    showLine: false,
                    borderWidth: 5,
                    immutableLabel: true,
                    pointRadius: 10,
                    pointHoverRadius: 12,
                }, {
                    data: circle(0, 0, 5),
                    pointRadius: 0,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                    borderColor: colors['gray'],
                    backgroundColor: colors['white-0']
                }
            ],
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            legend: {
                labels: {
                    filter: function (legendItem, chartData) {
                        return legendItem.datasetIndex <= 1;
                    }
                }
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return '(' + round(tooltipItem.xLabel, 2) + ', ' +
                            round(tooltipItem.yLabel, 2) + ')';
                    },
                },
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }]
            }
        }
    });

    let update = function () {
        updateScatter(tableData, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    // Link the form to chart
    let scatterForm = document.getElementById("scatter-form");
    scatterForm.oninput = function () {
        let x = parseInt(scatterForm.elements['x'].value);
        let y = parseInt(scatterForm.elements['y'].value);
        let r = parseInt(scatterForm.elements['r'].value);
        myChart.data.datasets[2].data = [{ x: x, y: y}];
        myChart.data.datasets[3].data = circle(x, y, r);
        myChart.update(0);
    }

    updateScatter(tableData, myChart);
    
    myChart.options.title.text = "Title"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "x";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "y";
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

/**
 *  This function is similar to updateLine but transforms longitude, latitude and distance to x and y
 *  coordinates to be rendered in the chart.
 *  @param table:   The dictionary object holding longitude, latitude and distance
 *  @param myChart: The Chartjs object to be updated.
 */
function updateScatter(table, myChart) {
    let start = 0;

    // The initial value of mins and maxs are 0 becaues the Sun is located at (0, 0)
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    let chart = myChart.data.datasets[0].data;
    for (let i = 0; i < table.length; i++) {
        let lo = table[i]['lo'];
        let la = table[i]['la'];
        let di = table[i]['di'];
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
 * @param {Chart.js object} myChart The chart to be updated
 * @param {number} minX 
 * @param {number} maxX 
 * @param {number} minY 
 * @param {number} maxY 
 * @param {boolean} suggested       Default is false. If true, min/max values won't be
 * updated if new values are greater (for min) or less (for max) than the existing values.
 */
function adjustScale(myChart, minX, maxX, minY, maxY, suggested=false) {
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
        minX = Math.min(minX, myChart.options.scales.xAxes[0].ticks.min);
        maxX = Math.max(maxX, myChart.options.scales.xAxes[0].ticks.max);
        minY = Math.min(minY, myChart.options.scales.yAxes[0].ticks.min);
        maxY = Math.max(maxY, myChart.options.scales.yAxes[0].ticks.max);
    }

    myChart.options.scales.xAxes[0].ticks.min = Math.floor(minX);
    myChart.options.scales.xAxes[0].ticks.max = Math.ceil(maxX);
    myChart.options.scales.yAxes[0].ticks.min = Math.floor(minY);
    myChart.options.scales.yAxes[0].ticks.max = Math.ceil(maxY);
    myChart.options.scales.xAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);
    myChart.options.scales.yAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);

    myChart.update(0);
}

/**
 * Generator function for the circle with specificed x, y and radius
 * @param {number} x        x-coordinate of the center of circle
 * @param {number} y        y-coordinate of the centor of circle
 * @param {number} radius   radius of the circle
 * @param {number} steps    Number of points to generate. Default is 500
 * @returns {Array}         An array of points
 */
function circle(x, y, radius, steps = 500) {
    let data = [];

    let step = 2 * Math.PI / steps;
    for (let i = 0; i < steps; i++) {
        data.push({
            x: x + Math.cos(step * i) * radius,
            y: y + Math.sin(step * i) * radius
        });
    }
    // Add a redundant point to complete the circle.
    data.push({
        x: x + radius,
        y: y
    })

    return data;
}