'use strict';

import Chart from "chart.js";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config.js"
import { updateLine, updateLabels, updateTableHeight } from "./util.js"
import { round } from "./my-math.js"

/**
 *  Function for two curves with independent x values.
 *  @returns {[Handsontable, Chart]}
 */
export function dual() {
    let tableData = [
        { x1: 0, y1: 25, x2: 1, y2: Math.sqrt(100) },
        { x1: 1, y1: 16, x2: 2, y2: Math.sqrt(200) },
        { x1: 2, y1: 9, x2: 3, y2: Math.sqrt(300) },
        { x1: 3, y1: 4, x2: 4, y2: Math.sqrt(400) },
        { x1: 4, y1: 1, x2: 5, y2: Math.sqrt(500) },
        { x1: 5, y1: 4, x2: 6, y2: Math.sqrt(600) },
        { x1: 6, y1: 9, x2: 7, y2: Math.sqrt(700) },
        { x1: 7, y1: 16, x2: 8, y2: Math.sqrt(800) },
        { x1: 8, y1: 25, x2: 9, y2: Math.sqrt(900) },
        { x1: 9, y1: 36, x2: 10, y2: Math.sqrt(1000) },
        { x1: '', y1: '', x2: 11, y2: Math.sqrt(1100) },
        { x1: '', y1: '', x2: 12, y2: Math.sqrt(1200) },
        { x1: '', y1: '', x2: 13, y2: Math.sqrt(1300) },
        { x1: '', y1: '', x2: 14, y2: Math.sqrt(1400) },
        { x1: '', y1: '', x2: 15, y2: Math.sqrt(1500) },
        { x1: '', y1: '', x2: 16, y2: Math.sqrt(1600) },
        { x1: '', y1: '', x2: 17, y2: Math.sqrt(1700) },
    ];

    let chartData1 = [];
    let chartData2 = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x1', 'y1', 'x2', 'y2'],
        maxCols: 4,
        columns: [
            { data: 'x1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'x2', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y2', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'y1',
                    data: chartData1,
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }, {
                    label: 'y2',
                    data: chartData2,
                    borderColor: colors['red'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }
            ]
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
                    position: 'bottom',
                }],
            }
        }
    });

    let update = function () {
        updateLine(tableData, myChart, 0, 'x1', 'y1');
        updateLine(tableData, myChart, 1, 'x2', 'y2');
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    updateLine(tableData, myChart, 0, 'x1', 'y1');
    updateLine(tableData, myChart, 1, 'x2', 'y2');

    myChart.options.title.text = "Title"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "x";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "y";
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}
