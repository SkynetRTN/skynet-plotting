'use strict';

import Chart from "chart.js/auto";
import { ChartConfiguration, ScatterDataPoint } from "chart.js";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config"
import { chartDataDiff, debounce, linkInputs, sanitizeTableData, throttle, updateLabels, updateTableHeight } from "./util"
import { round, lombScargle, backgroundSubtraction, ArrMath, clamp, floatMod } from "./my-math"
import { PulsarMode } from "./types/chart.js";

/**
 *  Returns generated table and chart for pulsar.
 *  @returns {[Handsontable, Chart]} Returns the table and the chart object.
 */
export function pulsar(): [Handsontable, Chart] {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Pulsar" id="pulsar-form" style="padding-bottom: 1em">\n' +
        '<div class="flex-container">\n' +
        '<div class="flex-item-grow1"><label><input type="radio" class="table" name="mode" value="lc" checked><span>Light Curve</span></label></div>\n' +
        '<div class="flex-item-grow1"><label><input type="radio" class="table" name="mode" value="ft"><span>Periodogram</span></label></div>\n' +
        '<div class="flex-item-grow0"><label><input type="radio" class="table" name="mode" value="pf"><span>Period Folding</span></label></div>\n' +
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
    //create sonification options
  document.getElementById("extra-options").insertAdjacentHTML("beforeend",
  '<div style="float: right;">\n' +
  '<button id="sonify"/>Sonify</button>\n' +
  '<button id="saveSonification"/>Save Sonification</button>\n' +
  '</div>\n'
  )

    const tableData = [];
    for (let i = 0; i < 1000; i++) {
        tableData[i] = {
            'time': (i * 0.2) + 3560,
            'chn1': (Math.random() / 20) + 20.63,
            'chn2': (Math.random() / 20) + 28.98,
        };
    }

    const container = document.getElementById('table-div');
    const tableOptions = {
        data: tableData,
        colHeaders: ['Time', 'Channel 1', 'Channel 2'],
        maxCols: 3,
        columns: [
            { data: 'time', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'chn1', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'chn2', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    };
    const hot = new Handsontable(container, { ...tableCommonOptions, ...tableOptions });

    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    const chartOptions: ChartConfiguration = {
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
                    pointBorderWidth: 0,
                    immutableLabel: false,
                    hidden: false,
                    fill: false
                }, {
                    label: 'Channel 2',
                    data: [],
                    backgroundColor: colors['red'],
                    borderWidth: 2,
                    pointBorderWidth: 0,
                    immutableLabel: false,
                    hidden: false,
                    fill: false
                }, {
                    label: 'Channel 1',
                    data: [],
                    backgroundColor: colors['blue'],
                    borderWidth: 2,
                    pointBorderWidth: 0,
                    hidden: true,
                    fill: false
                }, {
                    label: 'Channel 2',
                    data: [],
                    backgroundColor: colors['red'],
                    borderWidth: 2,
                    pointBorderWidth: 0,
                    hidden: true,
                    fill: false
                }, {
                    label: 'Difference',
                    data: [],
                    backgroundColor: colors['white-0'],
                    pointRadius: 0,
                    borderColor: colors['slate'],
                    borderWidth: 2,
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
            plugins: {
                legend: {
                    labels: {
                        filter: function (legendItem) {
                            return !legendItem.hidden;
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let precision = context.datasetIndex === 2 ||
                                context.datasetIndex === 3 ? 6 : 4
                            return '(' + round(context.parsed.x, precision) + ', ' +
                                round(context.parsed.y, 4) + ')';
                        },
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

    const myChart = new Chart(ctx, chartOptions) as Chart<'line'>;

    const update = function () {
        updatePulsar(myChart);
        updateTableHeight(hot);
    };
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    const pulsarForm = document.getElementById("pulsar-form") as PulsarForm;
    const lightCurveForm = document.getElementById('light-curve-form') as LightCurveForm;
    const fourierForm = document.getElementById('fourier-form') as FourierForm;
    const periodFoldingForm = document.getElementById("period-folding-form") as PeriodFoldingForm;
    const polarizationForm = document.getElementById("polarization-form") as PolarizationForm;

    pulsarForm.onchange = function () {
        let mode = pulsarForm.elements["mode"].value as PulsarMode;
        switchMode(myChart, mode);

        // This needs to happen after switchMode() since different parts of height
        // updates during switching.
        if (mode === 'lc') {
            updateTableHeight(hot);
        }
    }

    const lightCurveOninput = function () {
        this.dt.value = clamp(this.dt.value, 0, 30);

        let dt = this.dt.value;
        if (isNaN(dt)) {
            return;
        }
        const tableData = sanitizeTableData(hot.getData(), [0]);

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

        myChart.update('none');
    }
    lightCurveForm.oninput = debounce(lightCurveOninput, 1000);

    fourierForm.elements['fouriermode'].oninput = function () {
        if (fourierForm.elements['fouriermode'].value === 'p') {
            document.getElementById('period-div').hidden = false;
            document.getElementById("frequency-div").hidden = true;
        } else {
            document.getElementById('period-div').hidden = true;
            document.getElementById("frequency-div").hidden = false;
        }
    }

    const fourierOninput = function () {
        this.rc.value = clamp(this.rc.value, 0, 10000);

        let start, stop;
        if (this.fouriermode.value === 'p') {
            //period mode
            document.getElementById('period-div').hidden = false;
            document.getElementById("frequency-div").hidden = true;
            start = parseFloat(this.pstart.value);
            stop = parseFloat(this.pstop.value);

            myChart.options.scales['x'].title.text = "Period (sec)";
        } else {
            //frequency mode
            document.getElementById('period-div').hidden = true;
            document.getElementById("frequency-div").hidden = false;
            start = parseFloat(this.fstart.value);
            stop = parseFloat(this.fstop.value);

            myChart.options.scales['x'].title.text = "Frequency (Hz)";
        }
        updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, true);

        if (start > stop) {
            // alert("Please make sure the stop value is greater than the start value.");
            return;
        };
        let chn1 = myChart.data.datasets[0].data as ScatterDataPoint[];
        let chn2 = myChart.data.datasets[1].data as ScatterDataPoint[];
        let t = chn1.map(entry => entry.x);
        let y1 = chn1.map(entry => entry.y);
        let y2 = chn2.map(entry => entry.y);

        myChart.data.datasets[2].data = lombScargle(t, y1, start, stop, this.rc.value, this.fouriermode.value === 'f');
        myChart.data.datasets[3].data = lombScargle(t, y2, start, stop, this.rc.value, this.fouriermode.value === 'f');

        myChart.update('none')
    }

    const computeButton = document.getElementById('compute');
    computeButton.onclick = (...args) => {
        fourierOninput.apply(fourierForm, args);
    }


    const periodFoldingOninput = function () {
        this.pf.value = clamp(this.pf.value, 0, NaN);
        this.bins.value = clamp(this.bins.value, 0, 10000);

        let period = parseFloat(this.pf.value);
        let bins = parseInt(this.bins.value);
        let eqaulizer = parseFloat(polarizationForm.eq_num.value);
        myChart.data.datasets[5].data = periodFolding(myChart, 0, period, bins);
        myChart.data.datasets[6].rawData = periodFolding(myChart, 1, period, bins);
        myChart.data.datasets[6].data = myChart.data.datasets[6].rawData.map(
            point => ({ x: point.x, y: point.y * eqaulizer })
        );
        myChart.data.datasets[4].data = chartDataDiff(
            myChart.data.datasets[5].data as ScatterDataPoint[],
            myChart.data.datasets[6].data as ScatterDataPoint[]
        )
        myChart.update('none');
    }
    periodFoldingForm.oninput = debounce(periodFoldingOninput, 1000);

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
            myChart.data.datasets[5].data as ScatterDataPoint[],
            myChart.data.datasets[6].data as ScatterDataPoint[]
        )
        myChart.data.datasets[4].hidden = !this.diff.checked;
        myChart.update('none');
        updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, true);
    }
    polarizationForm.oninput = throttle(polarizationOninput, 16);   // 60 fps

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = "x";
    myChart.options.scales['y'].title.text = "y";
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, true);

    updatePulsar(myChart);
    updateTableHeight(hot);

    return [hot, myChart];
}

/**
 * This function handles the uploaded file to the pulsar chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table, triggers chart updates as well
 * @param evt       The uploadig event
 * @param table     The table to be updated
 * @param myChart
 */
export function pulsarFileUpload(evt: Event, table: Handsontable, myChart: Chart<'line'>) {
    // console.log("pulsarFileUpload called");
    let file = (evt.target as HTMLInputElement).files[0];

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

    const reader = new FileReader();
    reader.onload = () => {
        let data: string[] = (reader.result as string).split("\n");
        data = data.filter(str => (str !== null && str !== undefined && str !== ""));
        data = data.filter(str => (str[0] !== '#'));

        //turn each string into an array of numbers
        let rows: number[][] | string[][] = data.map(val => val.trim().split(/\ +/));

        rows = rows.map(row => row.map(str => parseFloat(str)));
        rows = rows.filter(row => (row[9] !== 0));
        rows = rows.map(row => [row[0], row[5], row[6]]) as number[][];

        const tableData = [];
        for (let row of rows) {
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

        let ts = rows.map(row => row[0]).filter(num => !isNaN(num));
        let nyquist = 1.0 / (2.0 * (ArrMath.max(ts) - ArrMath.min(ts)) / ts.length);

        const fourierForm = document.getElementById('fourier-form') as FourierForm;
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
 * @param table The table object
 * @param myChart The chart object
 */
function updatePulsar(myChart: Chart<'line'>) {
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
 * @param myChart 
 * @param mode
 * @param reset         Default is false. If true, will override `mode` and
 *                      set mode to 'lc', and reset Chart and chart-info-form.
 */
function switchMode(myChart: Chart<'line'>, mode: PulsarMode, reset: boolean = false) {
    const pulsarForm = document.getElementById("pulsar-form") as PulsarForm;
    const lightCurveForm = document.getElementById('light-curve-form') as LightCurveForm;
    const fourierForm = document.getElementById('fourier-form') as FourierForm;
    const periodFoldingForm = document.getElementById("period-folding-form") as PeriodFoldingForm;
    const polarizationForm = document.getElementById("polarization-form") as PolarizationForm;

    // Displaying the correct datasets
    for (let i = 0; i < 7; i++) {
        myChart.data.datasets[i].hidden = true;
    }
    let modified = myChart.data.modified;
    if (mode === 'lc' || reset) {
        if (pulsarForm.mode.value !== 'lc') {
            pulsarForm.mode[0].checked = true;
        }
        if (modified.lightCurveChanged) {
            modified.lightCurveChanged = false;
            lightCurveForm.oninput(null);
        }
        showDiv("light-curve-div");
        myChart.data.datasets[0].hidden = false;
        myChart.data.datasets[1].hidden = false;

        document.getElementById("extra-options").style.display = 'block';

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

        document.getElementById("extra-options").style.display = 'none';

    } else {
        if (modified.periodFoldingChanged) {
            modified.periodFoldingChanged = false;
            periodFoldingForm.oninput(null);
        }
        showDiv("period-folding-div");
        myChart.data.datasets[5].hidden = false;
        myChart.data.datasets[6].hidden = false;
        myChart.data.datasets[4].hidden = !polarizationForm.diff.checked;

        document.getElementById("extra-options").style.display = 'block';
    }
    myChart.update('none');

    if (reset) {
        lightCurveForm.dt.value = 3;

        fourierForm.rc.value = 1000;
        fourierForm.fouriermode.value = 'p';
        fourierForm.pstop.value = 3;
        fourierForm.fstart.value = 0.1;
        document.getElementById('period-div').hidden = false;
        document.getElementById('frequency-div').hidden = true;

        periodFoldingForm.pf.value = 0;
        periodFoldingForm.bins.value = 100;

        polarizationForm.eq.value = 0;
        polarizationForm.eq_num.value = 1;
        polarizationForm.diff.checked = false;

        myChart.data.modeLabels = {
            lc: { t: 'Title', x: 'x', y: 'y' },
            ft: { t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum' },
            pf: { t: 'Title', x: 'x', y: 'y' },
            lastMode: 'lc'
        };
    } else {
        myChart.data.modeLabels[myChart.data.modeLabels.lastMode] = {
            t: myChart.options.plugins.title.text as string,
            x: myChart.options.scales['x'].title.text as string,
            y: myChart.options.scales['y'].title.text as string
        }
        myChart.data.modeLabels.lastMode = mode;
    }

    myChart.options.plugins.title.text = myChart.data.modeLabels[reset ? 'lc' : mode].t;
    myChart.options.scales['x'].title.text = myChart.data.modeLabels[reset ? 'lc' : mode].x;
    myChart.options.scales['y'].title.text = myChart.data.modeLabels[reset ? 'lc' : mode].y;

    myChart.update('none');
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, true);
}

/**
 * This function serves as a switch for the visibility of the control div's for the different modes.
 * @param id The name of the div to be displayed.
 */
function showDiv(id: string) {
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

function periodFolding(myChart: Chart, src: number, period: number, bins: number): ScatterDataPoint[] {
    const data = myChart.data.datasets[src].data as ScatterDataPoint[];
    if (period === 0) {
        return data;
    }
    const minT = myChart.data.minT;

    const foldedData = data.map(val => ({
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

    const time_b: number[] = []
    const flux_b: number[] = []

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

    const pfData: ScatterDataPoint[] = [];

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