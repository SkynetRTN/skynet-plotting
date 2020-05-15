'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLabels, updateTableHeight } from "./shared-util.js"
import { round } from "./my-math.mjs"

/**
 *  Function for scatter chart.
 *  @returns {any[]}
 */
export function scatter() {
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
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: chartData,
                    backgroundColor: colors['orange'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: false,
                }, {
                    label: 'Sun',
                    data: [{ x: 0, y: 0 }],
                    backgroundColor: colors['bright'],
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                },
            ],
        },
        options: {
            hover: {
                mode: 'nearest'
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

    updateScatter(tableData, myChart);
    
    myChart.options.title.text = "Scatter"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "X";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "Y";
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

    minX -= 3;
    maxX += 3;
    minY -= 3;
    maxY += 3;

    // This is the ratio of the length of X axis over the length of Y axis
    const screenRatio = 1.8;
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

    myChart.options.scales.xAxes[0].ticks.min = Math.floor(minX);
    myChart.options.scales.xAxes[0].ticks.max = Math.ceil(maxX);
    myChart.options.scales.yAxes[0].ticks.min = Math.floor(minY);
    myChart.options.scales.yAxes[0].ticks.max = Math.ceil(maxY);
    myChart.options.scales.xAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);
    myChart.options.scales.yAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);

    myChart.update(0);
}