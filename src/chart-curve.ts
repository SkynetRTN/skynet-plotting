'use strict';

import Chart, { ChartConfiguration } from "chart.js/auto";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config";
import { updateLine, updateLabels, updateTableHeight } from "./util";

/**
 *  The function for up to 4 curves in the same chart. The curves share the same x values.
 *  @returns {[Handsontable, Chart]}
 */
export function curve(): [Handsontable, Chart] {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Lines" id="line-form" style="padding-bottom: 1em">\n' +
        '<div class="flex-container">\n' +
        '<div class="flex-item-grow1"><label><input type="radio" class="table" title="y1" name="lineCount" value="1" checked><span>1</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" class="table" title="y2" name="lineCount" value="2"><span>2</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" class="table" title="y3" name="lineCount" value="3"><span>3</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" class="table" title="y4" name="lineCount" value="4"><span>4</span></label></div>\n' +
        '<div class="flex-item-grow0"><label><input type="checkbox" title="Magnitude" name="magnitude"><span>Magnitudes</span></label></div>\n' +
        '</div>' +
        '</form>\n');

    const tableData = [
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

    const container = document.getElementById('table-div');
    const tableOptions: Handsontable.GridSettings = {
        data: tableData,
        colHeaders: ['x', 'y1', 'y2', 'y3', 'y4'],
        maxCols: 5,
        columns: [
            { data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    };
    const hot = new Handsontable(container, { ...tableCommonOptions, ...tableOptions });

    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    const chartOptions: ChartConfiguration = {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'y1',
                    data: [],
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }, {
                    label: 'y2',
                    data: [],
                    borderColor: colors['red'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }, {
                    label: 'y3',
                    data: [],
                    borderColor: colors['purple'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }, {
                    label: 'y4',
                    data: [],
                    borderColor: colors['orange'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
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
            plugins: {
                legend: {
                    labels: {
                        filter: function (legendItem) {
                            return !legendItem.hidden;
                        }
                    }
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                },
                y: {
                    reverse: false,
                }
            }
        }
    };

    const myChart = new Chart(ctx, chartOptions) as Chart<'line'>;
    const lineForm = document.getElementById('line-form') as LineForm;

    let lines = 1;
    lineForm.onchange = function () {
        myChart.options.scales['y'].reverse = lineForm.elements['magnitude'].checked;
        const lineCount = parseInt(lineForm.elements['lineCount'].value);
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
        myChart.update('none');
        updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);
    };

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = "x";
    myChart.options.scales['y'].title.text = "y";
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);


    const update = function () {
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
    return [hot, myChart];
    
}
