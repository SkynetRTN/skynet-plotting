'use strict';

import Chart from "chart.js/auto";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config.js"
import { chartDataDiff, debounce, linkInputs, sanitizeTableData, throttle, updateLabels, updateTableHeight } from "./util.js"
import { round, lombScargle, backgroundSubtraction, ArrMath, clamp } from "./my-math.js"

/**
 *  Returns generated table and chart for pulsar.
 *  @returns {[Handsontable, Chartjs]} Returns the table and the chart object.
 */
export function pulsar() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Pulsar" id="pulsar-form" style="padding-bottom: 1em">\n' +
        '<div class="flex-container">\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="mode" value="lc" checked><span>Light Curve</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" name="mode" value="ft"><span>Periodogram</span></label></div>\n' +
        '<div class="flex-item-grow0"><label><input type="radio" name="mode" value="pf"><span>Period Folding</span></label></div>\n' +
        '</div>\n' +
        '</form>\n' +
        '<div id="light-curve-div"></div>\n' +
        '<div id="fourier-div"></div>\n' +
        '<div id="period-folding-div"></div>\n'
    );

    document.getElementById('light-curve-div').innerHTML =
        '<form title="Light Curve" id="light-curve-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Background Scale (sec): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="dt" max="30" title="Background Scale" value=3></input></div>\n' +
        '</div>\n' +
        '</form>\n';

    document.getElementById("fourier-div").innerHTML =
        '<form title="Fourier" id="fourier-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Select Mode: </div>\n' +
        '<div class="col-sm-5"><select name="fouriermode" style="width: 100%;" title="Select Mode">\n' +
        '<option value="p" title="Period" selected>Period</option>\n' +
        '<option value="f" title="Frequency">Frequency</option>\n' +
        '</select></div>\n' +
        '</div>\n' +
        '<div id="period-div">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Start Period (sec): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="pstart" title="Start Period" value=0.1></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Stop Period (sec): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="pstop" title="Stop Period" value=3></input></div>\n' +
        '</div>\n' +
        '</div>\n' +
        '<div id="frequency-div" hidden="true">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Start Frequency (Hz): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="fstart" title="Start Frequency" value=0.1></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Stop Frequency (Hz): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.0001" name="fstop" title="Stop Frequency" value=30></input></div>\n' +
        '</div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Points: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="1" name="rc" title="Rendering Count" value="1000" max="10000"></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-12" style="color: grey;">For better resolution, decrease range and/or increase points.  Note, it is desirable to have multiple points across peaks before measuring them.  10,000 points takes a few minutes to compute.</div>\n' +
        '</div>\n' +
        '</form>\n' +
        '<div class="row justify-content-end">\n' +
        '<div class="col-4"><button id="compute" style="width: 100%;">Compute</button></div>\n' +
        '</div>\n';

    document.getElementById('period-folding-div').insertAdjacentHTML('beforeend',
        '<form title="Folding Period" id="period-folding-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Folding Period: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="pf" title="Folding Period" value=0></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Bins: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="bins" title="Bins" value=100></input></div>\n' +
        '</div>\n' +
        '</form>\n' +
        
        '<form title="Polarization Detection" id="polarization-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="flex-container" style="padding-bottom: 1em">\n' +
        '<div class="flex-item-grow1" style="color: grey;">Polarization Detection: </div>\n' +
        '<div class="flex-item-grow0"><label><input type="checkbox" name="diff" title="Show Difference"><span>Show Difference</span></label></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">Calibration:</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="Calibration" name="eq"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Calibration" name="eq_num" class="field"></div>\n' +
        '</div>\n' +
        '</form>\n'
    );

    let tableData = [];
    for (let i = 0; i < 1000; i++) {
        tableData[i] = {
            'time': (i * 0.2) + 3560,
            'chn1': (Math.random() / 20) + 20.63,
            'chn2': (Math.random() / 20) + 28.98,
        };
    }

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Time', 'Channel 1', 'Channel 2'],
        maxCols: 3,
        columns: [
            { data: 'time', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'chn1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'chn2', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            minT: Number.POSITIVE_INFINITY,
            modified: {
                lightCurveChanged: true,
                fourierChanged: true,
                periodFoldingChanged: true
            },
            modeLabels: {
                lc: { t: 'Title', x: 'x', y: 'y' },
                ft: { t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum' },
                pf: { t: 'Title', x: 'x', y: 'y' },
                lastMode: 'lc'
            },
            datasets: [
                {
                    label: 'Channel 1',
                    data: [],
                    backgroundColor: colors['blue'],
                    borderWidth: 2,
                    immutableLabel: false,
                    hidden: false,
                    fill: false
                }, {
                    label: 'Channel 2',
                    data: [],
                    backgroundColor: colors['red'],
                    borderWidth: 2,
                    immutableLabel: false,
                    hidden: false,
                    fill: false
                }, {
                    label: 'Channel 1',
                    data: [],
                    backgroundColor: colors['blue'],
                    borderWidth: 2,
                    hidden: true,
                    fill: false
                }, {
                    label: 'Channel 2',
                    data: [],
                    backgroundColor: colors['red'],
                    borderWidth: 2,
                    hidden: true,
                    fill: false
                }, {
                    label: 'Difference',
                    data: [],
                    backgroundColor: colors['white-0'],
                    pointRadius: 0,
                    pointBorderWidth: 0,
                    borderColor: colors['slate'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    hidden: true,
                    fill: false,
                }, {
                    label: 'Channel 1',
                    data: [],
                    backgroundColor: colors['blue'],
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBorderWidth: 0,
                    borderWidth: 2,
                    hidden: true,
                    fill: false
                }, {
                    label: 'Channel 2',
                    rawData: [],
                    data: [],
                    backgroundColor: colors['red'],
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBorderWidth: 0,
                    borderWidth: 2,
                    hidden: true,
                    fill: false
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
                    label: function (tooltipItem) {
                        let precision = tooltipItem.datasetIndex === 2 || 
                                        tooltipItem.datasetIndex === 3 ? 6 : 4
                        return '(' + round(tooltipItem.xLabel, precision) + ', ' +
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
        updatePulsar(hot, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    let pulsarForm = document.getElementById("pulsar-form");
    pulsarForm.onchange = function () {
        let mode = pulsarForm.elements["mode"].value;
        switchMode(myChart, mode);
        
        // This needs to happen after switchMode() since different parts of height
        // updates during switching.
        if (mode === 'lc') {
            updateTableHeight(hot);
        }
    }

    let lightCurveOninput = function () {
        this.dt.value = clamp(this.dt.value, 0, 30);

        let dt = this.dt.value;
        if (isNaN(dt)) {
            return;
        }
        let tableData = sanitizeTableData(hot.getData(), [0]);

        let time = [];
        let chn1 = [];
        let chn2 = [];
        for (let i = 0; i < tableData.length; i++) {
            if (isNaN(parseFloat(tableData[i][0]))) {
                continue;
            }
            time.push(parseFloat(tableData[i][0]));
            chn1.push(parseFloat(tableData[i][1]));
            chn2.push(parseFloat(tableData[i][2]));
        }
        let chn1Sub = backgroundSubtraction(time, chn1, dt);
        let chn2Sub = backgroundSubtraction(time, chn2, dt);

        chn1 = [];
        chn2 = [];
        for (let i = 0; i < time.length; i++) {
            myChart.data.minT = Math.min(myChart.data.minT, time[i]);
            chn1.push({
                'x': time[i],
                'y': chn1Sub[i]
            });
            chn2.push({
                'x': time[i],
                'y': chn2Sub[i]
            })
        }
        myChart.data.datasets[0].data = chn1;
        myChart.data.datasets[1].data = chn2;

        myChart.data.modified.fourierChanged = true;
        myChart.data.modified.periodFoldingChanged = true;

        myChart.update(0);
    }
    let lightCurveForm = document.getElementById('light-curve-form');
    lightCurveForm.oninput = debounce(lightCurveOninput, 1000);

    let fourierModeSelect = document.getElementById('fourier-form').fouriermode;
    fourierModeSelect.oninput = function () {
        if (this.value === 'p') {
            document.getElementById('period-div').hidden = false;
            document.getElementById("frequency-div").hidden = true;
        } else {
            document.getElementById('period-div').hidden = true;
            document.getElementById("frequency-div").hidden = false;
        }
    }

    let fourierOninput = function () {
        this.rc.value = clamp(this.rc.value, 0, 10000);

        let start, stop;
        if (this.fouriermode.value === 'p') {
            //period mode
            document.getElementById('period-div').hidden = false;
            document.getElementById("frequency-div").hidden = true;
            start = parseFloat(this.pstart.value);
            stop = parseFloat(this.pstop.value);

            myChart.options.scales.xAxes[0].scaleLabel.labelString = "Period (sec)";
        } else {
            //frequency mode
            document.getElementById('period-div').hidden = true;
            document.getElementById("frequency-div").hidden = false;
            start = parseFloat(this.fstart.value);
            stop = parseFloat(this.fstop.value);

            myChart.options.scales.xAxes[0].scaleLabel.labelString = "Frequency (Hz)";
        }
        updateLabels(myChart, document.getElementById('chart-info-form'), true);

        if (start > stop) {
            // alert("Please make sure the stop value is greater than the start value.");
            return;
        };
        let chn1 = myChart.data.datasets[0].data;
        let chn2 = myChart.data.datasets[1].data;
        let t = chn1.map(entry => entry.x);
        let y1 = chn1.map(entry => entry.y);
        let y2 = chn2.map(entry => entry.y);

        myChart.data.datasets[2].data = lombScargle(t, y1, start, stop, this.rc.value, this.fouriermode.value === 'f');
        myChart.data.datasets[3].data = lombScargle(t, y2, start, stop, this.rc.value, this.fouriermode.value === 'f');

        myChart.update(0)
    }
    let fourierForm = document.getElementById('fourier-form');
    let computeButton = document.getElementById('compute');
    computeButton.onclick = (...args) => {
        fourierOninput.apply(fourierForm, args);
    }

    let periodFoldingOninput = function () {
        this.pf.value   = clamp(this.pf.value, 0, NaN);
        this.bins.value = clamp(this.bins.value, 0, 10000);

        let period = parseFloat(this.pf.value);
        let bins = parseInt(this.bins.value);
        let eqaulizer = parseFloat(document.getElementById('polarization-form').eq_num.value);
        myChart.data.datasets[5].data = periodFolding(myChart, 0, period, bins);
        myChart.data.datasets[6].rawData = periodFolding(myChart, 1, period, bins);
        myChart.data.datasets[6].data = myChart.data.datasets[6].rawData.map(
            point => ({ x: point.x, y: point.y * eqaulizer })
        );
        myChart.data.datasets[4].data = chartDataDiff(
            myChart.data.datasets[5].data, myChart.data.datasets[6].data
        )
        myChart.update(0);
    }
    let periodFoldingForm = document.getElementById("period-folding-form");
    periodFoldingForm.oninput = debounce(periodFoldingOninput, 1000);

    let polarizationForm = document.getElementById("polarization-form");
    linkInputs(
        polarizationForm.eq,
        polarizationForm.eq_num,
        0.5, 2, 0.001, 1, true, true, 0, Number.POSITIVE_INFINITY
    );

    let polarizationOninput = function () {
        let eqaulizer = parseFloat(this.eq_num.value);
        myChart.data.datasets[6].data = myChart.data.datasets[6].rawData.map(
            point => ({ x: point.x, y: point.y * eqaulizer })
        );
        myChart.data.datasets[4].data = chartDataDiff(
            myChart.data.datasets[5].data, myChart.data.datasets[6].data
        )
        myChart.data.datasets[4].hidden = !this.diff.checked;
        myChart.update(0);
        updateLabels(myChart, document.getElementById('chart-info-form'), true);
    }
    polarizationForm.oninput = throttle(polarizationOninput, 16);   // 60 fps

    myChart.options.title.text = "Title"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "x";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "y";
    updateLabels(myChart, document.getElementById('chart-info-form'), true);

    updatePulsar(hot, myChart);
    updateTableHeight(hot);

    return [hot, myChart];
}

/**
 * This function handles the uploaded file to the pulsar chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table, triggers chart updates as well
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */
export function pulsarFileUpload(evt, table, myChart) {
    // console.log("pulsarFileUpload called");
    let file = evt.target.files[0];

    // File validation
    if (file === undefined) {
        return;
    }
    if (!file.name.match(".*\.txt")) {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a txt file.");
        return;
    }

    let reader = new FileReader();
    reader.onload = () => {
        let data = reader.result.split("\n");
        data = data.filter(str => (str !== null && str !== undefined && str !== ""));
        data = data.filter(str => (str[0] !== '#'));

        //turn each string into an array of numbers
        data = data.map(val => val.trim().split(/\ +/));

        data = data.map(row => row.map(str => parseFloat(str)));
        data = data.filter(row => (row[9] !== 0));
        data = data.map(row => [row[0], row[5], row[6]]);

        let tableData = [];
        for (let row of data) {
            if (isNaN(row[0])) {
                continue;
            }
            tableData.push({
                'time': row[0],
                'chn1': row[1],
                'chn2': row[2]
            });
        }
        tableData.sort((a, b) => a.time - b.time);
        table.updateSettings({ data: tableData });

        let ts = data.map(row => row[0]).filter(num => !isNaN(num));
        let nyquist = 1.0 / (2.0 * (ArrMath.max(ts) - ArrMath.min(ts)) / ts.length);

        let fourierForm = document.getElementById('fourier-form');
        fourierForm.pstart.value = Number((1 / nyquist).toPrecision(4));
        fourierForm.fstop.value = Number(nyquist.toPrecision(4));

        switchMode(myChart, 'lc', true);
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
function updatePulsar(table, myChart) {
    // console.log("updatePulsar called");
    myChart.data.minT = Number.POSITIVE_INFINITY;

    // Flag that every mode needs to be updated.
    myChart.data.modified.lightCurveChanged = true;
    myChart.data.modified.fourierChanged = true;
    myChart.data.modified.periodFoldingChanged = true;

    switchMode(myChart, 'lc');
}

/**
 * This function set up the chart by displaying only the appropriate datasets for a mode,
 * and then adjust the chart-info-form to match up with the mode.
 * @param {Chartjs object} myChart 
 * @param { 'lc' | 'ft' | 'pf' } mode
 * @param {boolean} reset               Default is false. If true, will override `mode` and
 *                                      set mode to 'lc', and reset Chart and chart-info-form.
 */
function switchMode(myChart, mode, reset = false) {
    // Displaying the correct datasets
    for (let i = 0; i < 7; i++) {
        myChart.data.datasets[i].hidden = true;
    }
    let modified = myChart.data.modified;
    if (mode === 'lc' || reset) {
        if (document.getElementById('pulsar-form').mode.value !== 'lc') {
            document.getElementById('pulsar-form').mode[0].checked = true;
        }
        if (modified.lightCurveChanged) {
            modified.lightCurveChanged = false;
            document.getElementById('light-curve-form').oninput();
        }
        showDiv("light-curve-div");
        myChart.data.datasets[0].hidden = false;
        myChart.data.datasets[1].hidden = false;
    } else if (mode === 'ft') {
        // Only update fourier transform periodogram when changes occured.
        if (modified.fourierChanged) {
            modified.fourierChanged = false;
            // document.getElementById('fourier-form').oninput();
            myChart.data.datasets[2].data = [];
            myChart.data.datasets[3].data = [];
        }
        showDiv("fourier-div");
        myChart.data.datasets[2].hidden = false;
        myChart.data.datasets[3].hidden = false;
    } else {
        if (modified.periodFoldingChanged) {
            modified.periodFoldingChanged = false;
            document.getElementById('period-folding-form').oninput();
        }
        showDiv("period-folding-div");
        myChart.data.datasets[5].hidden = false;
        myChart.data.datasets[6].hidden = false;
        myChart.data.datasets[4].hidden = 
            !document.getElementById('polarization-form').diff.checked;
    }
    myChart.update(0);

    if (reset) {
        document.getElementById("light-curve-form").dt.value = 3;

        document.getElementById('fourier-form').rc.value = 1000;
        document.getElementById('fourier-form').fouriermode.value = 'p';
        document.getElementById('fourier-form').pstop.value = 3;
        document.getElementById('fourier-form').fstart.value = 0.1;
        document.getElementById('period-div').hidden = false;
        document.getElementById('frequency-div').hidden = true;

        document.getElementById("period-folding-form").pf.value = 0;
        document.getElementById("period-folding-form").bins.value = 100;

        document.getElementById('polarization-form').eq.value = 0;
        document.getElementById('polarization-form').eq_num.value = 1;
        document.getElementById('polarization-form').diff.checked = false;
        
        myChart.data.modeLabels = {
            lc: { t: 'Title', x: 'x', y: 'y' },
            ft: { t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum' },
            pf: { t: 'Title', x: 'x', y: 'y' },
            lastMode: 'lc'
        };
    } else {
        myChart.data.modeLabels[myChart.data.modeLabels.lastMode] = {
            t: myChart.options.title.text,
            x: myChart.options.scales.xAxes[0].scaleLabel.labelString,
            y: myChart.options.scales.yAxes[0].scaleLabel.labelString
        }
        myChart.data.modeLabels.lastMode = mode;
    }
    
    myChart.options.title.text = myChart.data.modeLabels[reset ? 'lc' : mode].t;
    myChart.options.scales.xAxes[0].scaleLabel.labelString = myChart.data.modeLabels[reset ? 'lc' : mode].x;
    myChart.options.scales.yAxes[0].scaleLabel.labelString = myChart.data.modeLabels[reset ? 'lc' : mode].y;
    
    myChart.update(0);
    updateLabels(myChart, document.getElementById('chart-info-form'), true);
}

/**
 * This function serves as a switch for the visibility of the control div's for the different modes.
 * @param {str} id The name of the div to be displayed.
 */
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

function periodFolding(myChart, src, period, bins) {
    if (period === 0) {
        return myChart.data.datasets[src].data;
    }

    let data = myChart.data.datasets[src].data;
    let minT = myChart.data.minT;

    let foldedData = data.map(val => ({
        "x": floatMod(val.x - minT, period),
        "y": val.y
    }));

    // this sorts the time components of the array and then
    // sorts the flux components accordingly

    foldedData.sort((a, b) => a.x - b.x);

    if (bins <= 0) {
        let repeated = foldedData.map(val => ({
            "x": val.x + period,
            "y": val.y
        }));

        return foldedData.concat(repeated);
    }

    let time_b = []
    let flux_b = []

    //initialize j and new binned arrays
    let j = 0;

    //iterate over the input number of bins!
    for (let i = 0; i < bins; i++) {
        let num = 0; //initialize count
        time_b.push(period * (i + .5) / bins);  //initialize binned time
        flux_b.push(0);  //initialize binned flux

        while (j < foldedData.length && foldedData[j].x < (period * (i + 1)) / bins) {
            num = num + 1;
            flux_b[i] = flux_b[i] + foldedData[j].y;
            j = j + 1;//update count, total, and binned flux
        }

        if (num !== 0) {
            flux_b[i] = flux_b[i] / num; //average binned flux
        }
    }

    let pfData = [];

    for (let i = 0; i < bins; i++) {
        pfData.push({
            "x": time_b[i],
            "y": flux_b[i]
        })
    }
    for (let i = 0; i < bins; i++) {
        pfData.push({
            "x": time_b[i] + period,
            "y": flux_b[i]
        })
    }
    return pfData;
}

/**
 * This function computes the floating point modulo.
 * @param {number} a The dividend
 * @param {number} b The divisor
 */
function floatMod(a, b) {
    while (a > b) {
        a -= b;
    }
    return a;
}
