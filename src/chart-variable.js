'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLabels, updateTableHeight } from "./shared-util.js"
import { round } from "./my-math.js"

/**
 *  Returns generated table and chart for variable.
 *  @returns {[Handsontable, Chartjs]} Returns the table and the chart object.
 */
export function variable() {
    console.log("root func called");
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Variable" id="variable-form" style="padding-bottom: 1em">\n' +
        '<div class="flex-container">\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="mode" value="lc" checked><span>Lightcurve</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="mode" value="ft" disabled><span>Fourier</span></label></div>\n' +
        '<div class="flex-item-grow0"><label><input type="radio" name="mode" value="pf" disabled><span>Period Folding</span></label></div>\n' +
        '</div>\n' +
        '</form>\n' +
        '<div id="lightcurve-div"></div>\n' +
        '<div id="fourier-div"></div>\n' +
        '<div id="period-folding-div"></div>\n'
    );

    let tableData = [];
    for (let i = 0; i < 14; i++) {
        tableData[i] = {
            'id': i % 2 === 0 ? "Sample1" : "Sample2",
            'mjd': i % 2 === 0 ? i * 10 + Math.random() * 10 - 5 : tableData[i - 1].mjd,
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
            { data: 'id', type: 'text', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'mjd', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'mag', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'error', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            maxMJD: 0,
            minMJD: Number.POSITIVE_INFINITY,
            datasets: [
                {
                    label: 'Sample1',
                    data: chartData,
                    backgroundColor: colors['blue'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                    hidden: false,
                }, {
                    label: 'Sample2',
                    data: chartData,
                    backgroundColor: colors['red'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                    hidden: false,
                }, {
                    label: 'Lightcurve',
                    data: chartData,
                    backgroundColor: colors['purple'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                    hidden: true,
                }, {
                    label: 'Fourier',
                    data: chartData,
                    backgroundColor: colors['orange'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                    hidden: true,
                }, {
                    label: 'Period Folding',
                    data: chartData,
                    backgroundColor: colors['orange'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                    hidden: true,
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

    updateTableHeight(hot);

    let variableForm = document.getElementById("variable-form");
    variableForm.onchange = function () {
        let mode = variableForm.elements["mode"].value;
        if (mode === "lc") {
            showDiv("lightcurve-div");
        } else if (mode === "ft") {
            showDiv("fourier-div");
        } else {
            showDiv("period-folding-div");
        }
        updateTableHeight(hot);
    }

    return [hot, myChart];
}

/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 */
export function variableFileUpload(evt, table) {
    console.log("variableFileUpload called");
    let file = evt.target.files[0];

    if (file === undefined) {
        return;
    }

    // File type validation
    if (!file.type.match("(text/csv|application/vnd.ms-excel)") ||
        !file.name.match(".*\.csv")) {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a CSV file.");
        return;
    }

    let reader = new FileReader();
    reader.onload = () => {
        let data = reader.result.split("\n");

        // Need to trim because of weired end-of-line issues (potentially a Windows problem).
        let columns = data[0].trim().split(",");

        let id = columns.indexOf("id");
        let mjd = columns.indexOf("mjd");
        let mag = columns.indexOf("mag");
        let error = columns.indexOf("mag_error");

        let tableData = [];
        for (let i = 1; i < data.length; i++) {
            let entry = data[i].split(",");
            tableData.push({
                "id": entry[id],
                "mjd": parseFloat(entry[mjd]),
                "mag": parseFloat(entry[mag]),
                "error": parseFloat(entry[error]),
            });
        }
        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}

/**
 * This function is called when the values in table is changed (either by manual input or by file upload).
 * It then updates the chart according to the data in the table.
 * DATA FLOW: table -> chart
 * @param {Handsontable} table The table object
 * @param {Chartjs} myChart The chart object
 */
function updateVariable(table, myChart) {
    console.log("updateVariable called");

    myChart.data.maxMJD = 0;
    myChart.data.minMJD = Number.POSITIVE_INFINITY;

    let tableData = table.getData();
    let chartData = [];

    let index = {};
    let count = 0;

    for (let i = 0; i < tableData.length; i++) {
        let id = tableData[i][0];
        let mjd = parseFloat(tableData[i][1]);
        let mag = parseFloat(tableData[i][2]);
        if (id === '' || mjd === '' || mag === '' ||
            id === null || mjd === null || mag === null ||
            isNaN(mjd) || isNaN(mag)) {
            continue;
        }
        // Need to explicitly compare to "undefined". If use "(!index[id])", index[id] = 0 will evaluate
        // as if it is undefined.
        if (index[id] === undefined) {
            if (count === 2) {
                // More than 2 sources, ignore.
                continue;
            }
            index[id] = count++;
            chartData.push({
                "label": id,
                "data": [],
            });
        }
        chartData[index[id]].data.push({
            "x": mjd,
            "y": mag,
        });
        myChart.data.maxMJD = Math.max(myChart.data.maxMJD, mjd);
        myChart.data.minMJD = Math.min(myChart.data.minMJD, mjd);
    }

    for (let i = 0; i < 4; i++) {
        myChart.data.datasets[i].hidden = i >= count;
        if (chartData[i]) {
            myChart.data.datasets[i].label = chartData[i].label;
            myChart.data.datasets[i].data = chartData[i].data;
        }
    }
    updateChart(myChart, 0, 1);
    
    let variableForm = document.getElementById("variable-form");
    variableForm.mode.value = "lc";
    variableForm.mode[1].disabled = true;
    variableForm.mode[2].disabled = true;

    showDiv("lightcurve-div");

    lightcurve(myChart);
}

/**
 * This function is called whenever the data sources change (i.e. the values in the table change). 
 * It creates the specific input form that is used by the light curve mode.
 * DATA FLOW: chart[0], chart[1] -> chart[2]
 * @param myChart The chart object
 */
function lightcurve(myChart) {
    console.log("lightcurve called");
    let lcHTML = 
        '<form title="Lightcurve" id="lightcurve-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6">Select Source: </div>\n' +
        '<div class="col-sm-6"><select name="source" style="width: 100%;" title="Select Source">' +
        '<option value="none" title="None" selected disabled>None</option>\n';
    for (let i = 0; i < 2; i++) {
        let label = myChart.data.datasets[i].label;
        lcHTML += 
            '<option value="' + label + 
            '"title="' + label + 
            '">' + label + '</option>\n';
    }
    lcHTML += 
        '</select></div></div>\n' +
        '<div class="row">\n' +
            '<div class="col-sm-6">Reference Magnitude: </div>\n' +
            '<div class="col-sm-6"><input class="field" type="number" step="0.001" name="mag" title="Magnitude" value=0></input></div>\n' +
        '</div>\n' +
        '</form>\n';
    document.getElementById('lightcurve-div').innerHTML = lcHTML;
    let variableForm = document.getElementById('variable-form');
    let lightcurveForm = document.getElementById('lightcurve-form');
    lightcurveForm.onchange = function () {
        console.log("Selected sourche: ", this.source.value);
        console.log("Ref magnitude: ", [parseFloat(this.mag.value)]);
        if (this.source.value !== "none") {
            let datasets = myChart.data.datasets;
            let src, ref;
            if (this.source.value === datasets[0].label) {
                src = 0;
                ref = 1;
            } else {
                src = 1;
                ref = 0;
            }
            let lcData = [];
            let len = Math.min(datasets[0].data.length, datasets[1].data.length);
            for (let i = 0; i < len; i++) {
                lcData.push({
                    "x": datasets[src].data[i]["x"],
                    "y": datasets[src].data[i]["y"] - datasets[ref].data[i]["y"] + parseFloat(this.mag.value),
                });
            }
            variableForm.elements['mode'][1].disabled = false;
            variableForm.elements['mode'][2].disabled = false;

            myChart.data.datasets[2].data = lcData;
            updateChart(myChart, 2);
        }
    }

    let fHTML = '';

    let pfHTML = 
        '<form title="Period Folding" id="period-folding-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6">Period Folding: </div>\n' +
        '<div class="col-sm-6"><input class="field" type="number" step="0.0001" name="pf" title="Period Folding" value=0></input>\n' +
        '</div>\n' +
        '</form>\n';
    document.getElementById("period-folding-div").innerHTML = pfHTML;
    let periodFoldingForm = document.getElementById("period-folding-form");
    periodFoldingForm.onchange = function () {
        let pf = parseFloat(this.pf.value);
        if (pf !== 0) {
            let datasets = myChart.data.datasets;
            let minMJD = myChart.data.minMJD;
            let pfData = [];
            for (let i = 0; i < datasets[2].data.length; i++) {
                pfData.push({
                    "x": floatMod(datasets[2].data[i]["x"] - minMJD, pf * 2) + minMJD,
                    "y": datasets[2].data[i]["y"],
                });
            }
            console.log(pfData);
            myChart.data.datasets[4].data = pfData;
            updateChart(myChart, 4);
        }
    }
}

/**
 * This function set up the chart by hiding all unnecessary datasets, and then adjust the chart scaling
 * to fit the data to be displayed.
 * @param {Chartjs object} myChart 
 * @param  {Number[]} dataIndex 
 */
function updateChart(myChart, ...dataIndices) {
    console.log("updateChart called");
    console.log(dataIndices);
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < 5; i++) {
        myChart.data.datasets[i].hidden = true;
    }

    for (const dataIndex of dataIndices) {
        myChart.data.datasets[dataIndex].hidden = false;

        let data = myChart.data.datasets[dataIndex].data;
        for (let i = 0; i < data.length; i++) {
            minX = Math.min(data[i].x, minX);
            maxX = Math.max(data[i].x, maxX);
            minY = Math.min(data[i].y, minY);
            maxY = Math.max(data[i].y, maxY);
        }
    }

    const marginRatio = 0.2;
    minX -= (maxX - minX) * marginRatio;
    maxX += (maxX - minX) * marginRatio;
    minY -= (maxY - minY) * marginRatio;
    maxY += (maxY - minY) * marginRatio;

    myChart.options.scales.xAxes[0].ticks.min = minX;
    myChart.options.scales.xAxes[0].ticks.max = maxX;
    myChart.options.scales.xAxes[0].ticks.stepSize = (maxX - minX) / 12.6;
    myChart.options.scales.yAxes[0].ticks.min = minY;
    myChart.options.scales.yAxes[0].ticks.max = maxY;
    myChart.options.scales.yAxes[0].ticks.stepSize = (maxY - minY) / 7;

    myChart.update(0);
}

function showDiv(id) {
    document.getElementById("lightcurve-div").hidden = true;
    document.getElementById("fourier-div").hidden = true;
    document.getElementById("period-folding-div").hidden = true;

    document.getElementById(id).hidden = false;
}

function floatMod(a, b) {
    while (a > b) {
        a -= b;
    }
    return a;
}