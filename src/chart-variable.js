'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLabels, updateTableHeight } from "./shared-util.js"
import { round } from "./my-math.js"

/**
 *  Function for scatter chart.
 *  @returns {any[]}
 */
export function variable() {
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

    let tableData = [];
    for (let i = 0; i < 17; i++) {
        tableData[i] = {
            'id': "Sample",
            'mjd': i * 10 + Math.random() * 10 - 5,
            'mag': Math.random() * 20,
            'error': Math.random() * 10 - 5,
        };
    }

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['ID', 'MJD', 'Mag', "Error"],
        maxCols: 3,
        columns: [
            { data: 'id', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'mjd', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'mag', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'error', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
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
                // }, {
                //     label: 'Sun',
                //     data: [{ x: 0, y: 0 }],
                //     backgroundColor: colors['bright'],
                //     pointRadius: 10,
                //     pointHoverRadius: 12,
                //     pointBorderWidth: 2,
                //     immutableLabel: true,
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
        updateVariable(hot, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    updateVariable(hot, myChart);
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

export function variableFileUpload(evt, chart, table) {
    let file = evt.target.files[0];
    // File type validation
    if (!file.type.match("(text/csv|application/vnd.ms-excel)") ||
        !file.name.match(".*\.csv")) {
        console.log(file.type);
        console.log(file.name);
        alert("Please upload a CSV file.");
        return;
    }
    let reader = new FileReader();
    reader.onload = () => {
        let data = reader.result.split("\n");

        // Need to trim because of weired end of line issues (potentially a Windows problem).
        let columns = data[0].trim().split(",");

        let id = columns.indexOf("id");
        let mjd = columns.indexOf("mjd");
        let mag = columns.indexOf("mag");
        let error = columns.indexOf("mag_error");

        let tableData = [];
        for (let i = 1; i < data.length; i++) {
            let entry = data[i].split(",");
            tableData.push({ "id": entry[id], "mjd": entry[mjd], "mag": entry[mag], error: entry[error] });
        }
        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}


/**
 *  This function is similar to updateLine but transforms longitude, latitude and distance to x and y
 *  coordinates to be rendered in the chart.
 *  @param table:   The dictionary object holding longitude, latitude and distance
 *  @param myChart: The Chartjs object to be updated.
 */
function updateVariable(table, myChart) {
    let start = 0;

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;


    let tableData = table.getData();

    console.log(minX, maxX, minY, maxY);
    let chartData = myChart.data.datasets[0].data;
    for (let i = 0; i < tableData.length; i++) {
        let mjd = tableData[i][1];
        let mag = tableData[i][2];
        if (mjd === '' || mag === '' ||
            mjd === null || mag === null) {
            continue;
        }
        chartData[start++] = {
            "x": mjd,
            "y": mag,
        };
        if (mag == 0) {
            console.log(i, mjd, mag);
        }

        minX = Math.min(mjd, minX);
        maxX = Math.max(mjd, maxX);
        minY = Math.min(mag, minY);
        maxY = Math.max(mag, maxY);
    }
    while (chartData.length !== start) {
        chartData.pop();
    }
    
    console.log(minX, maxX, minY, maxY);

    const marginRatio = 0.2;
    minX -= (maxX - minX) * marginRatio;
    maxX += (maxX - minX) * marginRatio;
    minY -= (maxY - minY) * marginRatio;
    maxY += (maxY - minY) * marginRatio;

    // This is the ratio of the length of X axis over the length of Y axis
    // const screenRatio = 1.8;
    // let dataRatio = (maxX - minX) / (maxY - minY);

    // if (dataRatio < screenRatio) {
    //     let m = (maxX + minX) / 2;
    //     let d = (maxX - minX) / 2;
    //     maxX = m + d / dataRatio * screenRatio;
    //     minX = m - d / dataRatio * screenRatio;
    // } else {
    //     let m = (maxY + minY) / 2;
    //     let d = (maxY - minY) / 2;
    //     maxY = m + d * dataRatio / screenRatio;
    //     minY = m - d * dataRatio / screenRatio;
    // }

    // myChart.options.scales.xAxes[0].ticks.min = Math.floor(minX);
    // myChart.options.scales.xAxes[0].ticks.max = Math.ceil(maxX);
    // myChart.options.scales.yAxes[0].ticks.min = Math.floor(minY);
    // myChart.options.scales.yAxes[0].ticks.max = Math.ceil(maxY);
    // myChart.options.scales.xAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);
    // myChart.options.scales.yAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);

    myChart.options.scales.xAxes[0].ticks.max = maxX;
    myChart.options.scales.yAxes[0].ticks.min = minY;
    myChart.options.scales.yAxes[0].ticks.max = maxY;
    myChart.options.scales.xAxes[0].ticks.stepSize = (maxX - minX) / 7;
    myChart.options.scales.yAxes[0].ticks.stepSize = (maxY - minY) / 7;

    myChart.update(0);
}