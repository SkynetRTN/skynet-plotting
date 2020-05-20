'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLabels, updateTableHeight } from "./shared-util.js"
import { round, ArrMath } from "./my-math.mjs"

/**
 *  Returns generated table and chart for variable.
 *  @returns {[Handsontable, Chartjs]} Returns the table and the chart object.
 */
export function variable() {
    console.log("root func called");
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Variable" id="variable-form" style="padding-bottom: 1em">\n' +
        '<div class="flex-container">\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="mode" value="lc" checked><span>Light Curve</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="mode" value="ft" disabled><span>Periodogram</span></label></div>\n' +
        '<div class="flex-item-grow0"><label><input type="radio" name="mode" value="pf" disabled><span>Period Folding</span></label></div>\n' +
        '</div>\n' +
        '</form>\n' +
        '<div id="light-curve-div"></div>\n' +
        '<div id="fourier-div"></div>\n' +
        '<div id="period-folding-div"></div>\n'
    );

    let tableData = [];
    for (let i = 0; i < 14; i++) {
        tableData[i] = {
            'jd': i * 10 + Math.random() * 10 - 5,
            'src1': Math.random() * 20,
            'src2': Math.random() * 20,
        };
    }

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Julian Date', 'Sample1 Mag', 'Sample2 Mag'],
        maxCols: 3,
        columns: [
            { data: 'jd', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'src1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'src2', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            maxMJD: Number.NEGATIVE_INFINITY,
            minMJD: Number.POSITIVE_INFINITY,
            customLabels: {
                title: "Title",
                x: "x",
                y: "y",
                lastMode: "Variable",
            },
            datasets: [
                {
                    label: 'Sample1',
                    data: [],
                    backgroundColor: colors['blue'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    // immutableLabel: true,
                    hidden: false,
                }, {
                    label: 'Sample2',
                    data: [],
                    backgroundColor: colors['red'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    // immutableLabel: true,
                    hidden: false,
                }, {
                    label: 'Light Curve',
                    data: [],
                    backgroundColor: colors['purple'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    // immutableLabel: true,
                    hidden: true,
                }, {
                    label: 'Fourier',
                    data: [],
                    backgroundColor: colors['bright'],
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBorderWidth: 0,
                    // immutableLabel: true,
                    hidden: true,
                }, {
                    label: 'Period Folding',
                    data: [],
                    backgroundColor: colors['orange'],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    // immutableLabel: true,
                    hidden: true,
                }
            ]
        },
        options: {
            legend: {
                labels: {
                    filter: function (legendItem, chartData) {
                        return !legendItem.hidden;
                    }
                }
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return '(' + round(tooltipItem.xLabel, 4) + ', ' +
                               round(tooltipItem.yLabel, 4) + ')';
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

    lightCurve(myChart);
    
    let variableForm = document.getElementById("variable-form");
    let customLabels = myChart.data.customLabels;
    variableForm.onchange = function () {
        let mode = variableForm.elements["mode"].value;
        if (mode === "lc") {
            showDiv("light-curve-div");
            let lightCurveForm = document.getElementById("light-curve-form");
            lightCurveForm.oninput();
        } else if (mode === "ft") {
            showDiv("fourier-div");
            let fourierForm = document.getElementById("fourier-form");
            fourierForm.oninput();
        } else {
            showDiv("period-folding-div");
            let periodFoldingForm = document.getElementById("period-folding-form");
            periodFoldingForm.oninput();
        }
        if (mode === "ft") {
            customLabels.title = myChart.options.title.text;
            customLabels.x = myChart.options.scales.xAxes[0].scaleLabel.labelString;
            customLabels.y = myChart.options.scales.yAxes[0].scaleLabel.labelString;
            
            myChart.options.title.text = "Periodogram";
            myChart.options.scales.xAxes[0].scaleLabel.labelString = "Period (days)";
            myChart.options.scales.yAxes[0].scaleLabel.labelString = "Power Spectrum";
            myChart.update(0);
            updateLabels(myChart, document.getElementById('chart-info-form'), true, true, true, true);
        } else if (customLabels.lastMode === "ft") {
            myChart.options.title.text = customLabels.title;
            myChart.options.scales.xAxes[0].scaleLabel.labelString = customLabels.x;
            myChart.options.scales.yAxes[0].scaleLabel.labelString = customLabels.y;
            myChart.update(0);
            updateLabels(myChart, document.getElementById('chart-info-form'), true);
        }
        customLabels.lastMode = mode;

        updateTableHeight(hot);
    }
    
    myChart.options.title.text = "Title"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "x";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "y";
    updateLabels(myChart, document.getElementById('chart-info-form'), true);
    
    updateVariable(hot, myChart);
    updateTableHeight(hot);

    return [hot, myChart];
}

/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */
export function variableFileUpload(evt, table, myChart) {
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
        let data = reader.result.split("\n").filter(str => (str !== null && str !== undefined && str !== ""));

        // Need to trim because of weired end-of-line issues (potentially a Windows problem).
        let columns = data[0].trim().split(",");

        console.log(data);
        console.log(columns);

        let id_col = columns.indexOf("id");
        let mjd_col = columns.indexOf("mjd");
        let mag_col = columns.indexOf("mag");

        let src1 = data[1].split(",")[id_col];
        let src2 = data[2].split(",")[id_col];

        table.updateSettings({
            colHeaders: ['Julian Date', src1 + " Mag", src2 + " Mag"],
        })

        let tableData = [];
        for (let i = 0; i < (data.length - 1) / 2; i++) {
            let entry1 = data[i * 2 + 1].split(",");
            let entry2 = data[i * 2 + 2].split(",");

            let mjd1 = parseFloat(entry1[mjd_col]);
            let mag1 = parseFloat(entry1[mag_col]);
            let mag2 = parseFloat(entry2[mag_col]);
            if (isNaN(mjd1) || isNaN(mag1) || isNaN(mag2)) {
                continue;
            }
            tableData.push({
                "jd": mjd1,
                "src1": mag1,
                "src2": mag2,
            });
        }
        myChart.data.datasets[0].label = src1;
        myChart.data.datasets[1].label = src2;
        
        let variableForm = document.getElementById("variable-form");
        variableForm.elements['mode'][1].disabled = true;
        variableForm.elements['mode'][2].disabled = true;

        myChart.data.customLabels.title = "Title"
        myChart.data.customLabels.x = "x";
        myChart.data.customLabels.y = "y";

        myChart.options.title.text = "Title"
        myChart.options.scales.xAxes[0].scaleLabel.labelString = "x";
        myChart.options.scales.yAxes[0].scaleLabel.labelString = "y";
        updateLabels(myChart, document.getElementById('chart-info-form'), true);
        
        lightCurve(myChart);

        // Need to put this line down in the end, because it will trigger update on the Chart, which will 
        // in turn trigger update to the variable form and the light curve form, which needs to be cleared
        // prior to being triggered by this upload.
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
    
    for (let i = 0; i < 5; i++) {
        myChart.data.datasets[i].data = [];
    }

    let tableData = table.getData();
    let src1Data = [];
    let src2Data = [];

    for (let i = 0; i < tableData.length; i++) {
        let jd = tableData[i][0];
        let src1 = tableData[i][1];
        let src2 = tableData[i][2];

        myChart.data.minMJD = Math.min(myChart.data.minMJD, jd);
        myChart.data.maxMJD = Math.min(myChart.data.maxMJD, jd);

        src1Data.push({
            "x": jd,
            "y": src1,
        })
        src2Data.push({
            "x": jd,
            "y": src2,
        })
    }

    myChart.data.datasets[0].data = src1Data;
    myChart.data.datasets[1].data = src2Data;

    updateChart(myChart, 0, 1);

    let variableForm = document.getElementById("variable-form");
    variableForm.mode.value = "lc";
    variableForm.onchange();
}

/**
 * This function is called whenever the data sources change (i.e. the values in the table change). 
 * It creates the specific input form that is used by the light curve mode.
 * DATA FLOW: chart[0], chart[1] -> chart[2]
 * @param myChart The chart object
 */
function lightCurve(myChart) {
    console.log("lightCurve called");
    let lcHTML =
        '<form title="Light Curve" id="light-curve-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Select Variable Star: </div>\n' +
        '<div class="col-sm-5"><select name="source" style="width: 100%;" title="Select Source">\n' +
        '<option value="none" title="None" selected>None</option>\n';
    for (let i = 0; i < 2; i++) {
        let label = myChart.data.datasets[i].label;
        lcHTML +=
            '<option value="' + label +
            '"title="' + label +
            '">' + label + '</option>\n';
    }
    lcHTML +=
        '</select></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Reference Star Actual Mag: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="mag" title="Magnitude" value=0></input></div>\n' +
        '</div>\n' +
        '</form>\n';
    document.getElementById('light-curve-div').innerHTML = lcHTML;
    let variableForm = document.getElementById('variable-form');
    let lightCurveForm = document.getElementById('light-curve-form');
    lightCurveForm.oninput = function () {
        if (this.source.value === "none") {
            updateChart(myChart, 0, 1);
            variableForm.elements['mode'][1].disabled = true;
            variableForm.elements['mode'][2].disabled = true;
        } else {
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
            
            for (let i = 2; i < 5; i++) {
                myChart.data.datasets[i].label = "Variable Star Mag + (" + this.mag.value + " - Reference Star Mag)";
            }

            updateChart(myChart, 2);
            updateLabels(myChart, document.getElementById('chart-info-form'), true);
        }
    }

    let fHTML =
        '<form title="Fourier" id="fourier-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Start period: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="start" title="Start Period" value=0.1></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Stop period: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="stop" title="Stop Period" value=1></input></div>\n' +
        '</div>\n' +
        '</form>\n';

    document.getElementById("fourier-div").innerHTML = fHTML;
    let fourierForm = document.getElementById("fourier-form");
    fourierForm.oninput = function () {
        let start = parseFloat(this.start.value);
        let stop = parseFloat(this.stop.value);
        if (start > stop) {
            // alert("Please make sure the stop value is greater than the start value.");
            return;
        }
        let fData = [];

        let lcData = myChart.data.datasets[2].data;
        let tArray = lcData.map(entry => entry.x);
        let yArray = lcData.map(entry => entry.y);

        fData = lombScargle(tArray, yArray, start, stop, 1000);

        myChart.data.datasets[3].data = fData;
        
        updateChart(myChart, 3);
    }

    let pfHTML =
        '<form title="Period Folding" id="period-folding-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Folding Period: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="pf" title="Period Folding" value=0></input></div>\n' +
        '</div>\n' +
        '</form>\n';

    document.getElementById("period-folding-div").innerHTML = pfHTML;
    let periodFoldingForm = document.getElementById("period-folding-form");
    periodFoldingForm.oninput = function () {
        let period = parseFloat(this.pf.value);
        if (period !== 0) {
            let datasets = myChart.data.datasets;
            let minMJD = myChart.data.minMJD;
            let pfData = [];
            for (let i = 0; i < datasets[2].data.length; i++) {
                pfData.push({
                    "x": floatMod(datasets[2].data[i].x - minMJD, period),
                    "y": datasets[2].data[i].y,
                });
                pfData.push({
                    "x": pfData[pfData.length - 1].x + period,
                    "y": pfData[pfData.length - 1].y,
                })
            }
            // console.log(pfData);
            myChart.data.datasets[4].data = pfData;
        } else {
            myChart.data.datasets[4].data = myChart.data.datasets[2].data;
        }

        updateChart(myChart, 4);
        updateLabels(myChart, document.getElementById('chart-info-form'), true);
    }
}

/**
 * This function set up the chart by hiding all unnecessary datasets, and then adjust the chart scaling
 * to fit the data to be displayed.
 * @param {Chartjs object} myChart 
 * @param  {Number[]} dataIndex 
 */
function updateChart(myChart, ...dataIndices) {
    // console.log("updateChart called");
    // console.log(dataIndices);

    // let minX = Number.POSITIVE_INFINITY;
    // let maxX = Number.NEGATIVE_INFINITY;
    // let minY = Number.POSITIVE_INFINITY;
    // let maxY = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < 5; i++) {
        myChart.data.datasets[i].hidden = true;
    }

    myChart.options.scales.yAxes[0].ticks.reverse = true;

    for (const dataIndex of dataIndices) {
        myChart.data.datasets[dataIndex].hidden = false;
        if (dataIndex === 3) {
            myChart.options.scales.yAxes[0].ticks.reverse = false;
        }
        if (dataIndex === 2) {
            console.log(myChart.data.datasets[2].data);
        }

        // let data = myChart.data.datasets[dataIndex].data;

        // // console.log(data);

        // for (let i = 0; i < data.length; i++) {
        //     minX = Math.min(data[i].x, minX);
        //     maxX = Math.max(data[i].x, maxX);
        //     minY = Math.min(data[i].y, minY);
        //     maxY = Math.max(data[i].y, maxY);
        // }
    }

    // const marginRatio = 0.2;
    // minX -= (maxX - minX) * marginRatio;
    // maxX += (maxX - minX) * marginRatio;
    // minY -= (maxY - minY) * marginRatio;
    // maxY += (maxY - minY) * marginRatio;

    // myChart.options.scales.xAxes[0].ticks.min = minX;
    // myChart.options.scales.xAxes[0].ticks.max = maxX;
    // myChart.options.scales.xAxes[0].ticks.stepSize = (maxX - minX) / 12.6;
    // myChart.options.scales.yAxes[0].ticks.min = minY;
    // myChart.options.scales.yAxes[0].ticks.max = maxY;
    // myChart.options.scales.yAxes[0].ticks.stepSize = (maxY - minY) / 7;


    myChart.update(0);
}

function lombScargle(ts, ys, start, stop, steps = 1000) {
    if (ts.length != ys.length) {
        alert("Dimension mismatch between time array and value array.");
        return;
    }

    console.log("ts, ys", ts, ys);
    let step = (stop - start) / steps;

    let spectralPowerDensity = [];

    let nyquist = 1.0 / (2.0 * (ArrMath.max(ts) - ArrMath.min(ts)) / ts.length);
    let hResidue = ArrMath.sub(ys, ArrMath.mean(ys));
    console.log("yMean", ArrMath.mean(ys));
    console.log("hResidue", hResidue);
    let twoVarOfY = 2 * ArrMath.var(ys);

    console.log("hResidue", hResidue);
    console.log("2 * var(ys):", twoVarOfY);
    
    let period = start;

    // for (let i = 0; i < steps; i++) {
        // let frequency = (stop - start) / steps * i + start;

    while (period < stop) {
        let frequency = 1 / period;

        let omega = 2.0 * Math.PI * frequency;
        let twoOmegaT = ArrMath.mul(2 * omega, ts);
        let tau = Math.atan2(ArrMath.sum(ArrMath.sin(twoOmegaT)), ArrMath.sum(ArrMath.cos(twoOmegaT))) / (2.0 * omega);
        let omegaTMinusTau = ArrMath.mul(omega, ArrMath.sub(ts, tau));

        // if (i === 500) {
        //     console.log("Omega: ", omega);
        //     console.log("twoOmegaT: ", twoOmegaT);
        //     console.log("Tau: ", tau);
        //     console.log("omegaTMinusTau: ", omegaTMinusTau);
        //     console.log("frequency:", frequency);
        // }

        spectralPowerDensity.push({
            x: period,
            y: (( Math.pow( ArrMath.dot(hResidue, ArrMath.cos(omegaTMinusTau)), 2.0) ) /
                ( ArrMath.dot(ArrMath.cos(omegaTMinusTau)) ) +
                ( Math.pow( ArrMath.dot(hResidue, ArrMath.sin(omegaTMinusTau)), 2.0) ) /
                ( ArrMath.dot(ArrMath.sin(omegaTMinusTau)) )) / twoVarOfY,
        });

        period += step;
    }

    return spectralPowerDensity;
}

function showDiv(id) {
    document.getElementById("light-curve-div").hidden = true;
    document.getElementById("fourier-div").hidden = true;
    document.getElementById("period-folding-div").hidden = true;

    document.getElementById("table-div").hidden = true;
    document.getElementById("add-row-button").hidden = true;

    document.getElementById(id).hidden = false;
    if (id === "light-curve-div") {
        document.getElementById("table-div").hidden = false;
        document.getElementById("add-row-button").hidden = false;
    }
}

function floatMod(a, b) {
    while (a > b) {
        a -= b;
    }
    return a;
}
