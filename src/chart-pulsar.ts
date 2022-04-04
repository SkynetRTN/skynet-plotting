'use strict';

import Chart from "chart.js/auto";
import { ChartConfiguration, ScatterDataPoint } from "chart.js";
import Handsontable from "handsontable";

import { saveAs } from 'file-saver';

import { tableCommonOptions, colors } from "./config"
import { chartDataDiff, debounce, linkInputs, sanitizeTableData, throttle, updateLabels, updateTableHeight, formatTime, getDateString } from "./util"
import { round, lombScargle, backgroundSubtraction, ArrMath, clamp, floatMod, median } from "./my-math"
import { PulsarMode } from "./types/chart.js";
import { build } from "vite";
//import { arrayMax, stringify } from "handsontable/helpers";
import { selectElementIfAllowed } from "handsontable/helpers/dom";

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
        '<button id="saveSonification";/>Save Sonification</button>\n' +
        '</div>\n'
    );
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y Axis";
    const tableData = [];
    for (let i = 0; i < 1000; i++) {
        tableData[i] = {
            'time': (i * 0.2) + 3560,
            'chn1': (Math.random() / 20) + 20.63,
            'chn2': (Math.random() / 20) + 28.98,
        };
    }

    const container = document.getElementById('table-div');
          // unhide table whenever interface is selected
  document.getElementById("chart-type-form").addEventListener("click", () => {
    container.style.display = "block";
    document.getElementById('add-row-button').hidden = false;
    document.getElementById('file-upload-button').hidden = false;
    });
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

    //Audio Context
    const audioCtx = new AudioContext();
    //audioCtx.suspend();

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
    const sonificationButton = document.getElementById("sonify") as HTMLInputElement;
    const saveSonify = document.getElementById("saveSonification") as HTMLInputElement;

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
        this.pf.value = clamp(this.pf.value,0, NaN);
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

    var sonifiedChart = new AudioBufferSourceNode(audioCtx);
    var volume = new GainNode(audioCtx, {gain: 1});
    volume.connect(audioCtx.destination);

    function play(){
        //audioCtx.resume();
        if(pulsarForm.elements["mode"].value === 'lc')
        {
            sonifiedChart = sonify(audioCtx,myChart,0,1,volume);
            sonifiedChart.onended = pause; //bad, must change
        }
        if(pulsarForm.elements["mode"].value === 'pf')
            sonifiedChart = sonify(audioCtx,myChart,5,6,volume,true);
        sonificationButton.innerHTML = "Stop";
        sonificationButton.style.backgroundColor = colors["red"];
        sonificationButton.style.color = "white";
        sonifiedChart.start();
    }
    function pause(){
        sonificationButton.onclick = play;
        sonifiedChart.stop();
        //audioCtx.suspend();
        sonificationButton.innerHTML = "Sonify";
        sonificationButton.style.backgroundColor = ''
        sonificationButton.style.color = "black";
    }
    
    saveSonify.onclick = function (){
        if(pulsarForm.elements["mode"].value === 'lc')
        {
            if(!sonifiedChart.buffer)
                sonifiedChart = sonify(audioCtx,myChart,0,1,volume)
            downloadBuffer(sonifiedChart.buffer)
        }

        
        if(pulsarForm.elements["mode"].value === 'pf')
        {
            if(!sonifiedChart.buffer)
                sonifiedChart = sonify(audioCtx,myChart,4,5,volume,true)
            downloadBuffer(sonifiedChart.buffer, 60)
        }
    }

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

    for (let i in myChart.data.datasets)//empty data on upload
        myChart.data.datasets[i].data = [];


    var type: string;

    if(file.name.match(".*\.bestprof"))
    {
        type = "pressto"
    }
    else if(file.name.match(".*\.txt"))//we'll check file type later
    {}
    else
    {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a txt or bestprof file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        var data: string[] = (reader.result as string).split("\n");

        if(!type)
        {
            if(data[0].slice(0,7) == "# Input")
                type = "pressto";

            else
                type = "standard";
        }

        if(type === "standard"){

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

        //PRESSTO files
        if(type === "pressto")
        {
            let period = parseFloat(data[15].split(' ').filter(str => str!='')[4])/1000; 
            let fluxstr: string[] = data.filter(str => (str[0] !== '#' && str.length!=0)).map(str => str.slice(6).trim());
            let fluxes: number[] = fluxstr.map(f => parseFloat(f.split("e+")[0]) * (10 ** parseFloat(f.split("e+")[1])))
            let sampleRat = period/fluxes.length;

            var max = ArrMath.max(fluxes);
            //console.log(max)
            let med = median(fluxes);
            //console.log([med,max])

            const chartData = [];
            for (let i = 0; i < 2*fluxes.length; i++) {
                let flux = fluxes[i%fluxes.length];
                if (isNaN(flux)) {
                    continue;
                }
                chartData.push({
                    'x': sampleRat * i,
                    'y': (flux-med)/(max-med),
                });
            }

            presstoMode(myChart,chartData,period)

        }
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

    } 
    else {
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

        periodFoldingForm.elements["pf"].disabled      = false;
        periodFoldingForm.elements["bins"].disabled    = false;
        polarizationForm.hidden                        = false;
        pulsarForm.mode[0].disabled                    = false;
        pulsarForm.mode[1].disabled                    = false;

        polarizationForm.eq.value = 0;
        polarizationForm.eq_num.value = 1;
        polarizationForm.diff.checked = false;

        myChart.data.modeLabels = {
            lc: { t: 'Title', x: 'x', y: 'y' },
            ft: { t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum' },
            pf: { t: 'Title', x: 'x', y: 'y' },
            lastMode: 'lc'
        };
        myChart.data.datasets[5].label = "Channel 1";

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

function presstoMode(myChart: Chart<'line'>, data: ScatterDataPoint[], period: number)
{
    for(let i = 0; i < myChart.data.datasets.length; i++)
    {
        myChart.data.datasets[i].hidden = true;
        myChart.data.datasets[i].data = [];
    }
    
    myChart.data.datasets[5].hidden = false;
    myChart.data.datasets[5].data = data;
    myChart.data.datasets[5].label = "Channel 1 + Channel 2";
    myChart.data.datasets[6].data = data;

    let periodForm = document.getElementById("period-folding-form") as PeriodFoldingForm;
    let polForm    = document.getElementById("polarization-form") as PolarizationForm;
    let modeForm   = document.getElementById('pulsar-form') as PulsarForm;

    periodForm.elements["pf"].value       = period.toString();
    periodForm.elements["bins"].value     = (data.length/2).toString();
    modeForm.mode.value                   = 'pf';
    polForm.elements["eq_num"].value      = '1';
    polForm.elements["eq"].value          = '0';
    periodForm.elements["pf"].disabled    = true;
    periodForm.elements["bins"].disabled  = true;
    polForm.hidden                        = true;
    modeForm.mode[0].disabled             = true;
    modeForm.mode[1].disabled             = true;

    myChart.data.modeLabels = {
        lc: { t: 'Title', x: 'x', y: 'y' },
        ft: { t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum' },
        pf: { t: 'Title', x: 'x', y: 'y' },
        lastMode: 'pf'
    };

    myChart.options.plugins.title.text = 'Title';
    myChart.options.scales['x'].title.text = 'x';
    myChart.options.scales['y'].title.text = 'y';

    updateLabels(myChart,document.getElementById('chart-info-form') as ChartInfoForm, true);

    showDiv("period-folding-div");
    document.getElementById("extra-options").style.display = 'block';


    myChart.update()

}

/*************************************
 * SONIFICATION
 ************************************/

//May want to add a mono mode. I hate how this function looks but it works
/**
 * This function creates an audioBuffer using data from the chart
 * @param ctx The audioContext
 * @param myChart The chart to be sonified.
 * @param dataSet1 The dataset to sonify as the first stereo channel.
*  @param dataSet2 The dataset to sonify as the second stereo channel.
 * @param loop Loop audio?
 */
function sonify(ctx: AudioContext, myChart: Chart, dataSet1: number, dataSet2: number, destination?: AudioNode, loop: boolean = true){

    let channel0 = myChart.data.datasets[dataSet1].data as ScatterDataPoint[],
        channel1 = myChart.data.datasets[dataSet2].data as ScatterDataPoint[],
        time = channel0[channel0.length-1].x - channel0[0].x;//length of the audio buffer
    
    if(loop)//This smooths out the looping by adding an extra point with the same y value as the first on the end
    {
        var first1: ScatterDataPoint = {y:0,x:0};
        first1.y = channel0[0].y;
        var first2: ScatterDataPoint = {y:0,x:0};
        first2.y = channel1[0].y

        first1.x = channel0[channel0.length-1].x + time/channel0.length;
        first2.x = channel0[channel0.length-1].x + time/channel0.length;

        console.log(first1)
        console.log(myChart.data.datasets[dataSet1].data[0])
        channel0 = channel0.concat(first1);
        channel1 = channel1.concat(first2);
        time = channel0[channel0.length-1].x - channel0[0].x;//length of the audio buffer
    }

    let norm0 = 1 / ArrMath.max(channel0.map(p => p.y))
    let norm1 = 1 / ArrMath.max(channel1.map(p => p.y))

    // Create an empty stereo buffer at the sample rate of the AudioContext. First channel is channel 1, second is channel 2.
    var arrayBuffer = ctx.createBuffer(2,ctx.sampleRate*time, ctx.sampleRate);//lasts as long as time

    let prev0 = 0;//data point with the greatest time value less than the current time
    let prev1 = 0;
    let next0 = 1;//next data point
    let next1 = 1;

    for (var i = 0; i < arrayBuffer.length; i++) {
        let x0 = channel0[0].x + i/ctx.sampleRate;//channel0[0].x + i/ctx.sampleRate is the time on the chart the sample is
        let x1 = channel0[0].x + i/ctx.sampleRate;
        if(x0 > channel0[next0].x){
            prev0 = next0;
            next0++;
        }
        if(x1 > channel1[next1].x){
            prev1 = next1
            next1++;
        }

        arrayBuffer.getChannelData(0)[i] = norm0 * linearInterpolation(channel0[prev0],channel0[next0],x0) * (2*Math.random()-1); // Left Channel
        arrayBuffer.getChannelData(1)[i] = norm1 * linearInterpolation(channel1[prev1],channel1[next1],x1) * (2*Math.random()-1);  //multiply by norm: the maximum y value is 10 in the buffer
    }
    
    // Get an AudioBufferSourceNode to play our buffer.
    const sonifiedChart = ctx.createBufferSource();//Note to self: see if this works if not a const
    sonifiedChart.loop = loop; //play on repeat?
    sonifiedChart.buffer = arrayBuffer
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    if(destination)
        sonifiedChart.connect(destination);
    else
    sonifiedChart.connect(ctx.destination);
    return sonifiedChart;
}

//accepts x values and returns a y value based on a line between the points immediately before and after the given x value
function linearInterpolation(prev: ScatterDataPoint, next: ScatterDataPoint, x: number): number
{
    let slope = (next.y-prev.y)/(next.x-prev.x)
    let y = slope*(x-prev.x) + prev.y
    return y;
}

/**
 * This function converts an icky Buffer [ :( ] into an epic blob in the stylings of a .wav [ :D ]
 * @param buf The audioBuffer to make into a file.
 * @param time Desired time length of the file in seconds. Loops the buffer if greater than the buffer time.
 */
function bufferToWav(buf: AudioBuffer, time: number)
{   
    var numOfChan = buf.numberOfChannels,
        numOfSamples = Math.round(time * buf.sampleRate),
        length = numOfSamples * numOfChan * 4 + 44//add room for metadata
    length = length > 2147483648? 2147483648 : length; //cuts back if the length is beyond 2GB (Hopefully )
    
    var buffer = new ArrayBuffer(length),
        view = new DataView(buffer), //Where we put a da data
        channels = [], 
        sample,
        i,
        offset = 0,
        pos = 0;

    // write WAVE header
	setUint32(0x46464952);                         //"RIFF"
	setUint32(length - 8);                         //The length of the rest of the file
	setUint32(0x45564157);                         //"WAVE"

	setUint32(0x20746d66);                         //"fmt " chunk
	setUint32(16);                                 //subchunk size = 16
	setUint16(1);                                  //PCM (uncompressed)
	setUint16(numOfChan);                          //What it says on the tin
	setUint32(buf.sampleRate);                     
	setUint32(buf.sampleRate * 4 * numOfChan);     //byte rate
	setUint16(numOfChan * 4);                      //block-align
	setUint16(32);                                 //32-bit

	setUint32(0x61746164);                         //"DATA" - chunk
	setUint32(length - pos - 4);                   //chunk length

    // write interleaved data
    for(i = 0; i < numOfChan; i++)
        channels.push(buf.getChannelData(i));
    
    while(pos < length) {
        for(i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clip invalid values
            sample *= ((1<<31)-1); // scale to 32-bit signed int
            setUint32(sample);
        }

        offset++                                     // next source sample
        if (offset >= buf.length)
            offset = 0;//loop back to buffer start
            
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data: any) {
        view.setUint16(pos, data, true);
        pos += 2;
      }
    
    function setUint32(data: any) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

/**
 * This function downloads a buffer as a .wav
 * @param buf The audioBuffer to make into a file.
 * @param time Time length of the file in seconds. Defaults to the length of the buffer.
 */
function downloadBuffer(buf: AudioBuffer, time?: number)
{
    if(!time)
        time = buf.length / buf.sampleRate; //default to buffer length

    saveAs(bufferToWav(buf,time), 'sonification-' + formatTime(getDateString()) + '.wav');
}