'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLine, updateLabels, updateTableHeight } from "./shared-util.js"

/**
 *  The function for up to 4 curves in the same chart. The curves share the same x values.
 *  @returns {any[]}
 */
export function curve() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Lines" id="line-form" style="padding-bottom: 1em">\n' +
        '<div class="flex-container">\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="1" checked><span>1</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="2"><span>2</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="3"><span>3</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="4"><span>4</span></label></div>\n' +
        '<div class="flex-item-grow0"><label><input type="checkbox" name="magnitude"><span>Magnitudes</span></label></div>\n' +
        '</div>' +
        '</form>\n');

    let lineForm = document.getElementById('line-form');

    let lines = 1;

    let tableData = [
        { "x": 0, "y1": 25, "y2": '', "y3": '', "y4": '' },
        { "x": 1, "y1": 16, "y2": '', "y3": '', "y4": '' },
        { "x": 2, "y1": 9, "y2": '', "y3": '', "y4": '' },
        { "x": 3, "y1": 4, "y2": '', "y3": '', "y4": '' },
        { "x": 4, "y1": 1, "y2": '', "y3": '', "y4": '' },
        { "x": 5, "y1": 4, "y2": '', "y3": '', "y4": '' },
        { "x": 6, "y1": 9, "y2": '', "y3": '', "y4": '' },
        { "x": 7, "y1": 16, "y2": '', "y3": '', "y4": '' },
        { "x": 8, "y1": 25, "y2": '', "y3": '', "y4": '' },
        { "x": 9, "y1": 36, "y2": '', "y3": '', "y4": '' },
        { "x": '', "y1": '', 'y2': '', "y3": '', "y4": '' },
        { "x": '', "y1": '', 'y2': '', "y3": '', "y4": '' },
        { "x": '', "y1": '', 'y2': '', "y3": '', "y4": '' },
        { "x": '', "y1": '', 'y2': '', "y3": '', "y4": '' },
        { "x": '', "y1": '', 'y2': '', "y3": '', "y4": '' },
    ];

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x', 'y1', 'y2', 'y3', 'y4'],
        maxCols: 5,
        columns: [
            { data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'y1',
                    data: chartData[0],
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }, {
                    label: 'y2',
                    data: chartData[1],
                    borderColor: colors['red'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }, {
                    label: 'y3',
                    data: chartData[2],
                    borderColor: colors['purple'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }, {
                    label: 'y4',
                    data: chartData[3],
                    borderColor: colors['orange'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }
            ]
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            legend: {
                onClick: function (e) {
                    e.stopPropagation();
                },
                labels: {
                    filter: function (legendItem, chartData) {
                        return !legendItem.hidden;
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
                yAxes: [{
                    ticks: {
                        reverse: false,
                    }
                }]
            }
        }
    });

    let update = function () {
        updateTableHeight(hot);
        for (let i = 0; i < lines; i++) {
            updateLine(tableData, myChart, i, 'x', 'y' + (i + 1));
        }
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    updateLine(tableData, myChart, 0, 'x', 'y1');

    lineForm.onchange = function () {
        myChart.options.scales.yAxes[0].ticks.reverse = lineForm.elements['magnitude'].checked;
        let lineCount = lineForm.elements['lineCount'].value;
        if (lineCount !== lines) {
            let newCols = [{ data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } }];
            for (let i = 0; i < lineCount; i++) {
                newCols.push({
                    data: 'y' + (i + 1), type: 'numeric', numericFormat: { pattern: { mantissa: 2 } }
                });
            }

            // Turning off stretchH and then turn it back on -- a workaround
            //   to fix the horizontal scroll bar issue when adding more cols.
            hot.updateSettings({ stretchH: 'none' });
            hot.updateSettings({ columns: newCols });
            hot.updateSettings({ stretchH: 'all' });

            for (let i = 0; i < 4; i++) {
                myChart.data.datasets[i].hidden = (i >= lineCount);
            }
            lines = lineCount;
            for (let i = 0; i < lines; i++) {
                updateLine(tableData, myChart, i, 'x', 'y' + (i + 1));
            }
        }
        myChart.update(0);
        updateLabels(myChart, document.getElementById('chart-info-form'));
    };

    myChart.options.title.text = "Curve"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "X";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "Y";
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}
