import Chart from "chart.js/auto";
import {ChartConfiguration, ScatterDataPoint} from "chart.js";
import Handsontable from "handsontable";

import {colors, tableCommonOptions} from "./config"
import {chartDataDiff, debounce, linkInputs, sanitizeTableData, throttle, updateLabels, updateTableHeight} from "./util"
import {ArrMath, backgroundSubtraction, clamp, floatMod, lombScargle, median, round} from "./my-math"
import {Mode} from "./types/chart.js";
import {pause, play, saveSonify, Set2DefaultSpeed} from "./sonification";
// import {zoom} from "chartjs-plugin-zoom";
// import {TransientChart} from "./chart-transient-utils/chart-transient-chart";


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
        '<div class="col-4"><button class="compute" id="compute" style="width: 100%;">Compute</button></div>\n' +
        '</div>\n';

    document.getElementById('period-folding-div').insertAdjacentHTML('beforeend',
        '<form title="Folding Period" id="period-folding-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        // '<div class="row">\n' +
        // '<div class="col-sm-7">Folding Period: </div>\n' +
        // '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="pf" title="Folding Period" value=0></input></div>\n' +
        // '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-1"><input type="checkbox" class="range" name="doublePeriodMode" value="0" id="doublePeriodMode" checked></div>\n' +
        '<div class="col-sm-5">Show Two Periods</div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Period (sec):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Period" name="period"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Period" name="period_num" class="field" StringFormat={}{0:N2} step="0.001"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Phase (cycles):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="phase" name="phase"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="phase_num" name="phase_num" class="field"></div>\n' +

        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Bins:</div>\n' +
        '<div class="col-sm-4 range"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Bins" name="bins" class="field" value=100 step="0.001"></div>\n' +
        '<div class="row">\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '</div>\n' +

        // '<div class="row">\n' +
        // '<div class="col-sm-3 des">Bins: </div>\n' +
        // '<div class="col-sm-7 range"></div>\n' +
        // '<div class="col-sm-3 text"><input class="field" type="number" step="0.001" name="bins" title="Bins" value=100></input></div>\n' +
        // '</div>\n' +
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
        '<div class="row" style = "position: absolute; left: 55%">\n' +
        '<button class = "graphControl" id="panLeft">' +
        '<center class = "graphControl">&#8592;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="panRight">' +
        '<center class = "graphControl">&#8594;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="zoomIn">' +
        '<center class = "graphControl">&plus;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="zoomOut">' +
        '<center class = "graphControl">&minus;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="Reset" style="width: auto" >' +
        '<center class = "graphControl" style="font-size: 16px">Reset</center></button>\n' +
        '</div>\n' +
        '<button id="sonify" style = "position: relative; left:92px;"/>Sonify</button>' +
        '<label style = "position:relative; right:73px;">Speed:</label>' +
        '<input class="extraoptions" type="number" id="speed" min="0" placeholder = "1" value = "1" style="position:relative; right:205px; width: 52px;" >' +
        '<button id="saveSonification" style = "position:relative; left:50px;"/>Save Sonification</button>' +
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
            {data: 'time', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'chn1', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'chn2', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    };
    const hot = new Handsontable(container, {...tableCommonOptions, ...tableOptions});

    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    //Audio Context
    const audioCtx = new AudioContext();
    var audioSource = new AudioBufferSourceNode(audioCtx);
    var audioControls = {
        speed: document.getElementById("speed") as HTMLInputElement,
        playPause: document.getElementById("sonify") as HTMLButtonElement,
        save: document.getElementById("saveSonification") as HTMLButtonElement
    }

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
                lc: {t: 'Title', x: 'x', y: 'y'},
                ft: {t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum'},
                pf: {t: 'Title', x: 'x', y: 'y'},
                pressto: {t: 'Title', x: 'x', y: 'y'},
                gravity: {t: 'Title', x: 'x', y: 'y'},
                lastMode: 'lc'
            },
            nyquist: 0,
            sonification:
                {
                    audioContext: audioCtx,
                    audioSource: audioSource,
                    audioControls: audioControls
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
                // zoom: {
                //     pan: {
                //       enabled: true,
                //       mode: 'x',
                //     },
                //     zoom: {
                //       wheel: {
                //         enabled: true,
                //       },
                //       mode: 'x',
                //     },
                //   },
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
                zoom: {
                    pan: {
                        enabled: true,
                        mode: "x",
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        mode: 'x',
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        maxTicksLimit: 9,
                        //There seems to be an underlying issue with ticks on logarithmic graphs where they get rounded weirdly, 
                        //this solves that. Yes, this function literally does nothing, except get chart.js to work right somehow.
                        callback: function (tickValue) {
                            return tickValue;
                        },
                    },
                }
            },

        }
    };

    const myChart = new Chart(ctx, chartOptions) as Chart<'line'>;
    handleChartZoomOptions(myChart);
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
    const saveSon = document.getElementById("saveSonification") as HTMLInputElement;

    pulsarForm.onchange = function () {
        let mode = pulsarForm.elements["mode"].value as Mode;
        switchMode(myChart, mode);

        // This needs to happen after switchMode() since different parts of height
        // updates during switching.
        if (mode === 'lc') {
            updateTableHeight(hot);
        }

        //enable zoom on x-axis in light curve and period folding mode
        if (mode === 'lc' || mode === 'pf') {
            myChart.resetZoom();
            myChart.options.plugins.zoom.pan.enabled = true;
            myChart.options.plugins.zoom.zoom.wheel.enabled = true;
        } else {
            myChart.resetZoom();
            myChart.options.plugins.zoom.pan.enabled = false;
            myChart.options.plugins.zoom.zoom.wheel.enabled = false;

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
        myChart.data.minT = Number.POSITIVE_INFINITY;
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
    // if(parseFloat(this.pstart.value)<){

    // }
    const fourierOninput = function () {
        this.rc.value = clamp(this.rc.value, 0, 10000);
        let nyquist = myChart.data.nyquist;

        let start, stop;
        if (this.fouriermode.value === 'p') {
            //period mode
            document.getElementById('period-div').hidden = false;
            document.getElementById("frequency-div").hidden = true;

            if (this.pstart.value < Number((1 / nyquist).toPrecision(4))) {
                this.pstart.value = Number((1 / nyquist).toPrecision(4));
            }
            if (this.pstop.value < this.pstart.value) {
                this.pstop.value = this.pstart.value;
            }
            start = parseFloat(this.pstart.value);
            stop = parseFloat(this.pstop.value);

            myChart.options.scales['x'].title.text = "Period (sec)";
            myChart.options.scales['x'].type = 'logarithmic';
            console.log(myChart.options.scales['x'].min);
        } else {
            //frequency mode
            document.getElementById('period-div').hidden = true;
            document.getElementById("frequency-div").hidden = false;
            start = parseFloat(this.fstart.value);
            stop = parseFloat(this.fstop.value);

            myChart.options.scales['x'].title.text = "Frequency (Hz)";
            myChart.options.scales['x'].type = 'linear';
        }


        let tend = (myChart.data.datasets[1].data[myChart.data.datasets[1].data.length - 1] as ScatterDataPoint).x;
        let tstart = (myChart.data.datasets[0].data[0] as ScatterDataPoint).x;
        let range = Math.abs(tstart - tend);
        if (periodFoldingForm["period_num"].min != fourierForm.pstart.value) {
            linkInputs(
                periodFoldingForm["period"],
                periodFoldingForm["period_num"],
                parseFloat(fourierForm.pstart.value), range, 0.01, parseFloat(fourierForm.pstart.value), true
            );
            periodFoldingForm.oninput(null);//an argument is not needed here, VScode lies
        }

        updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, true);

        if (start > stop) {
            // alert("Please make sure the stop value is greater than the start value.");
            return;
        }

        let chn1 = myChart.data.datasets[0].data as ScatterDataPoint[];
        let chn2 = myChart.data.datasets[1].data as ScatterDataPoint[];
        let t = chn1.map(entry => entry.x);
        let y1 = chn1.map(entry => entry.y);
        let y2 = chn2.map(entry => entry.y);

        myChart.data.datasets[2].data = lombScargle(t, y1, start, stop, this.rc.value, this.fouriermode.value === 'f');
        myChart.data.datasets[3].data = lombScargle(t, y2, start, stop, this.rc.value, this.fouriermode.value === 'f');

        myChart.options.scales.x.min = (myChart.data.datasets[2].data[0] as ScatterDataPoint).x;
        myChart.options.scales.x.max = (myChart.data.datasets[2].data[this.rc.value - 1] as ScatterDataPoint).x;

        myChart.update('none')
    }

    const computeButton = document.getElementById('compute');
    computeButton.onclick = (...args) => {
        fourierOninput.apply(fourierForm, args);
    }

    periodFoldingForm.doublePeriodMode.onchange = function () {
        this.bins.value = clamp(this.bins.value, 0, 10000);
        let period = parseFloat(periodFoldingForm.period_num.value);
        let bins = parseInt(this.bins.value);
        let phase = parseFloat(periodFoldingForm.phase_num.value);
        let whetherDouble = periodFoldingForm.doublePeriodMode.checked

        myChart.data.datasets[5].data = periodFolding(myChart, 0, period, bins, phase, whetherDouble)
        myChart.data.datasets[6].rawData = periodFolding(myChart, 1, period, bins, phase, whetherDouble)
    }

    const periodFoldingOninput = function () {
        let srcStart: number = 0;
        let srcEnd: number = 0;
        let period: number = parseFloat(periodFoldingForm.period_num.value);
        ;
        console.log(myChart.data.datasets)
        if (myChart.data.datasets[0].data.length > 0 && myChart.data.datasets[1].data.length > 0) {
            srcStart = 0;
            srcEnd = 1;
        } else if (myChart.data.datasets[5].data.length > 0) {
            srcStart = 5
            srcEnd = 6
        }

        let start = (myChart.data.datasets[srcStart].data[0] as ScatterDataPoint).x;
        let end = (myChart.data.datasets[srcEnd].data[myChart.data.datasets[srcEnd].data.length - 1] as ScatterDataPoint).x;
        let range = Math.abs(start - end);
        let step = 10e-5

        // if ((periodFoldingForm.period_num.value/range)*0.01 > 10e-5){
        //     step = round((periodFoldingForm.period_num.value/range)*0.01, 5)
        // }

        if (periodFoldingForm.period_num.value * 10e-4 > 10e-6) {
            step = round(periodFoldingForm.period_num.value * periodFoldingForm.period_num.value * 10e-4 / range, 6)
        } else {
            step = 10e-6
        }
        periodFoldingForm["period_num"].step = step

        // periodFoldingForm["phase_num"].step = 0.01*periodFoldingForm["phase_num"].value/range

        // this.pf.value = clamp(this.pf.value,0, NaN);
        this.bins.value = clamp(this.bins.value, 0, 10000);

        let bins = parseInt(this.bins.value);
        let phase = parseFloat(periodFoldingForm.phase_num.value);
        let whetherDouble = periodFoldingForm.doublePeriodMode.checked
        let eqaulizer = parseFloat(polarizationForm.eq_num.value);
        if (srcStart == 0)
            period = parseFloat(clamp(period, parseFloat(fourierForm["pstart"].value), range));

        myChart.data.datasets[5].data = periodFolding(myChart, srcStart, period, bins, phase, whetherDouble);
        myChart.data.datasets[6].rawData = periodFolding(myChart, srcEnd, period, bins, phase, whetherDouble);

        myChart.data.datasets[6].data = myChart.data.datasets[6].rawData.map(
            point => ({x: point.x, y: point.y * eqaulizer})
        );
        myChart.data.datasets[4].data = chartDataDiff(
            myChart.data.datasets[5].data as ScatterDataPoint[],
            myChart.data.datasets[6].data as ScatterDataPoint[]
        )
        myChart.update('none');
        console.log(myChart.data.datasets)

    }
    //set period precision
    periodFoldingForm.onchange = debounce(() => {
        let period = periodFoldingForm["period_num"].value;
        let precision: number = 0;
        if (period.includes(".")) {
            precision = period.split(".")[1].length;
        } else {
            period += "."
        }


        while (precision < 4) {
            period += "0";
            precision += 1;
        }

        periodFoldingForm["period_num"].value = period;
    }, 5);

    periodFoldingForm.oninput = throttle(periodFoldingOninput, 16);
    // periodFoldingForm.oninput = debounce(periodFoldingOninput, 1000);

    linkInputs(//Phase slider
        periodFoldingForm["phase"],
        periodFoldingForm["phase_num"],
        0,
        1,
        0.01,
        0
    );
    linkInputs(//Period Slider
        periodFoldingForm["period"],
        periodFoldingForm["period_num"],
        0.1, 199.8000, 0.01, 0.1, true//199.blah blah is the range of the default data set
    );
    linkInputs(//calibration slider
        polarizationForm.eq,
        polarizationForm.eq_num,
        0.5, 2, 0.001, 1, true, true, 0, Number.POSITIVE_INFINITY
    );


    let polarizationOninput = function () {
        let eqaulizer = parseFloat(this.eq_num.value);
        myChart.data.datasets[6].data = myChart.data.datasets[6].rawData.map(
            point => ({x: point.x, y: point.y * eqaulizer})
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

    sonificationButton.onclick = () => play(myChart);
    saveSon.onclick = () => saveSonify(myChart);

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
    pause(myChart);
    Set2DefaultSpeed(myChart);

    let file = (evt.target as HTMLInputElement).files[0];

    // File validation
    if (file === undefined) {
        return;
    }

    for (let i in myChart.data.datasets)//empty data on upload
        myChart.data.datasets[i].data = [];
    myChart.data.sonification.audioSource.buffer = null;


    var type: string;

    if (file.name.match(".*\.bestprof")) {
        type = "pressto"
    } else if (file.name.match(".*\.txt"))//we'll check file type later
    {
        let periodForm = document.getElementById("period-folding-form") as PeriodFoldingForm;
        periodForm.elements["period"].disabled = false;
        periodForm.elements["period_num"].disabled = false;
    } else {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a txt or bestprof file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        var data: string[] = (reader.result as string).split("\n");

        if (!type) {
            if (data[0].slice(0, 7) == "# Input")
                type = "pressto";

            else
                type = "standard";
        }

        if (type === "standard") {

            data = data.filter(str => (str !== null && str !== undefined && str !== ""));
            data = data.filter(str => (str[0] !== '#'));

            //turn each string into an array of numbers
            let rows: number[][] | string[][] = data.map(val => val.trim().split(/\ +/));

            rows = rows.map(row => row.map(str => parseFloat(str)));
            const validIndex = rows[0].length - 1;
            rows = rows.filter(row => (row[validIndex] !== 0));
            rows = rows.map(row => [row[0], row[5], row[6]]) as number[][];
            if (rows.length === 0) {
                alert("All Observation Sweeps Are Invalid!\nFile Upload Failed.");
                return;
            }

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
            table.updateSettings({data: tableData});

            let ts = rows.map(row => row[0]).filter(num => !isNaN(num));
            let nyquist = 1.0 / (2.0 * (ArrMath.max(ts) - ArrMath.min(ts)) / ts.length);

            const fourierForm = document.getElementById('fourier-form') as FourierForm;

            fourierForm.pstart.value = Number((1 / nyquist).toPrecision(4));
            fourierForm.fstop.value = Number(nyquist.toPrecision(4));
            myChart.data.nyquist = nyquist;

            switchMode(myChart, 'lc', true, false);
        }

        //PRESSTO files
        if (type === "pressto") {
            myChart.data.minT = 0;
            let period = parseFloat(data[15].split(' ').filter(str => str != '')[4]) / 1000;
            let fluxstr: string[] = data
            // console.log(fluxstr);
            if (data[27].includes("\t")) {
                fluxstr = data.filter(str => (str[0] !== '#' && str.length != 0)).map(str => str.split("\t")[str.split("\t").length - 1].trim());
            } else {
                fluxstr = data.filter(str => (str[0] !== '#' && str.length != 0)).map(str => str.split(" ")[str.split(" ").length - 1].trim());
            }
            // console.log(fluxstr);
            if (!fluxstr[0].includes("e+")) {
                var fluxes: number[] = fluxstr.map(Number);
            } else {
                var fluxes: number[] = fluxstr.map(f => parseFloat(f.split("e+")[0]) * (10 ** parseFloat(f.split("e+")[1])));
            }
            // console.log(fluxes);
            let sampleRat = period / fluxes.length;

            var max = ArrMath.max(fluxes);
            //console.log(max)
            let med = median(fluxes);
            //console.log([med,max])

            const chartData = [];
            for (let i = 0; i < 2 * fluxes.length; i++) {
                let flux = fluxes[i % fluxes.length];
                if (isNaN(flux)) {
                    continue;
                }
                chartData.push({
                    'x': sampleRat * i,
                    'y': (flux - med) / (max - med),
                });
            }
            presstoMode(myChart, chartData, period)

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
function switchMode(myChart: Chart<'line'>, mode: Mode, reset: boolean = false, clearInter: boolean = true) {
    const pulsarForm = document.getElementById("pulsar-form") as PulsarForm;
    const lightCurveForm = document.getElementById('light-curve-form') as LightCurveForm;
    const fourierForm = document.getElementById('fourier-form') as FourierForm;
    const periodFoldingForm = document.getElementById("period-folding-form") as PeriodFoldingForm;
    const polarizationForm = document.getElementById("polarization-form") as PolarizationForm;

    pause(myChart, clearInter);
    Set2DefaultSpeed(myChart);
    myChart.data.sonification.audioSource.buffer = null;

    //Reset the chart to defining it's bounds based on the data
    myChart.options.scales.x.min = null;
    myChart.options.scales.x.max = null;

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
        myChart.options.scales['x'].type = 'linear';

        document.getElementById("extra-options").style.display = 'block';

    } else if (mode === 'ft') {
        // Only update fourier transform periodogram when changes occured.
        if (modified.fourierChanged) {
            modified.fourierChanged = false;
            //document.getElementById('fourier-form').oninput();
            myChart.data.datasets[2].data = [];
            myChart.data.datasets[3].data = [];
        } else {
            //I think logarithmic scales do chart bounds differently, so we have to specify the ends of the datasets as max and min
            myChart.options.scales.x.min = (myChart.data.datasets[2].data[0] as ScatterDataPoint)?.x;
            myChart.options.scales.x.max = (myChart.data.datasets[2].data[myChart.data.datasets[2].data.length - 1] as ScatterDataPoint)?.x;
        }

        showDiv("fourier-div");
        myChart.data.datasets[2].hidden = false;
        myChart.data.datasets[3].hidden = false;

        document.getElementById("extra-options").style.display = 'none';
        if (fourierForm.fouriermode.value === 'p') {
            myChart.options.scales['x'].type = 'logarithmic';
        } else {
            myChart.options.scales['x'].type = 'linear';
        }
    } else {
        if (modified.periodFoldingChanged) {
            modified.periodFoldingChanged = false;
            periodFoldingForm.oninput(null);
        }
        showDiv("period-folding-div");
        myChart.data.datasets[5].hidden = false;
        myChart.data.datasets[6].hidden = false;
        myChart.data.datasets[4].hidden = !polarizationForm.diff.checked;
        myChart.options.scales['x'].type = 'linear';
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

        // periodFoldingForm.pf.value = 0;
        periodFoldingForm['period_num'].value = 0
        periodFoldingForm.bins.value = 100;

        // periodFoldingForm.elements["pf"].disabled      = false;
        periodFoldingForm['period_num'].value = 0
        periodFoldingForm.elements["bins"].disabled = false;
        polarizationForm.hidden = false;
        pulsarForm.mode[0].disabled = false;
        pulsarForm.mode[1].disabled = false;

        polarizationForm.eq.value = 0;
        polarizationForm.eq_num.value = 1;
        polarizationForm.diff.checked = false;

        myChart.data.modeLabels = {
            lc: {t: 'Title', x: 'x', y: 'y'},
            ft: {t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum'},
            pf: {t: 'Title', x: 'x', y: 'y'},
            pressto: {t: 'Title', x: 'x', y: 'y'},
            gravity: {t: 'Title', x: 'x', y: 'y'},
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

function periodFolding(myChart: Chart, src: number, period: number, bins: number, phase: number, whetherDouble: boolean): ScatterDataPoint[] {
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

    let temp_x = 0
    period = Math.abs(time_b[0] - time_b[time_b.length - 1])
    for (let i = 0; i < bins; i++) {
        temp_x = phase * period + floatMod(time_b[i], period);
        if (temp_x >= period) {
            temp_x -= period
        }


        pfData.push({
            "x": temp_x,
            "y": flux_b[i]
        })
    }
    if (whetherDouble === true) {
        for (let i = 0; i < bins; i++) {
            temp_x = phase * period + floatMod(time_b[i], period);
            if (temp_x >= period) {
                temp_x -= period
            }


            pfData.push({
                "x": temp_x + period,
                "y": flux_b[i]
            })
        }
    }
    pfData.sort((a, b) => a.x - b.x);
    return pfData;
}

function presstoMode(myChart: Chart<'line'>, data: ScatterDataPoint[], period: number) {
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        myChart.data.datasets[i].hidden = true;
        myChart.data.datasets[i].data = [];
    }

    myChart.data.datasets[5].hidden = false;
    myChart.data.datasets[5].data = data;
    myChart.data.datasets[5].label = "Channel 1 + Channel 2";
    myChart.data.datasets[6].data = data;

    let periodForm = document.getElementById("period-folding-form") as PeriodFoldingForm;
    let polForm = document.getElementById("polarization-form") as PolarizationForm;
    let modeForm = document.getElementById('pulsar-form') as PulsarForm;

    periodForm.elements["period_num"].value = period.toString();
    periodForm.elements["bins"].value = (data.length / 2).toString();
    modeForm.mode.value = 'pf';
    polForm.elements["eq_num"].value = '1';
    polForm.elements["eq"].value = '0';
    periodForm.elements["period"].disabled = true;
    periodForm.elements["period_num"].disabled = true;
    periodForm.elements["bins"].disabled = true;
    polForm.hidden = true;
    modeForm.mode[0].disabled = true;
    modeForm.mode[1].disabled = true;

    myChart.data.modeLabels = {
        lc: {t: 'Title', x: 'x', y: 'y'},
        ft: {t: 'Periodogram', x: 'Period (sec)', y: 'Power Spectrum'},
        pf: {t: 'Title', x: 'x', y: 'y'},
        pressto: {t: 'Title', x: 'x', y: 'y'},
        gravity: {t: 'Title', x: 'x', y: 'y'},
        lastMode: 'pressto'
    };

    myChart.options.plugins.title.text = 'Title';
    myChart.options.scales['x'].title.text = 'x';
    myChart.options.scales['y'].title.text = 'y';

    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, true);

    showDiv("period-folding-div");
    document.getElementById("extra-options").style.display = 'block';


    myChart.update()
}

const handleChartZoomOptions = (myChart: Chart) => {
    let Reset = document.getElementById("Reset") as HTMLInputElement;
    let panLeft = document.getElementById("panLeft") as HTMLInputElement;
    let panRight = document.getElementById("panRight") as HTMLInputElement;
    let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
    let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;

    let pan: number;

    panLeft.onmousedown = function () {
        pan = setInterval(() => {
            myChart.pan(5)
        }, 20)
    }
    panLeft.onmouseup = panLeft.onmouseleave = function () {
        clearInterval(pan);
    }
    panRight.onmousedown = function () {
        pan = setInterval(() => {
            myChart.pan(-5)
        }, 20)
    }
    panRight.onmouseup = panRight.onmouseleave = function () {
        clearInterval(pan);
    }

    Reset.onclick = function () {
        myChart.resetZoom();
        myChart.update();
    }

    let zoom: number;
    zoomIn.onmousedown = function () {
        zoom = setInterval(() => {
            myChart.zoom(1.03)
        }, 20);

    }
    zoomIn.onmouseup = zoomIn.onmouseleave = function () {
        clearInterval(zoom);
    }
    zoomOut.onmousedown = function () {
        zoom = setInterval(() => {
            myChart.zoom(0.97);
        }, 20);
    }
    zoomOut.onmouseup = zoomOut.onmouseleave = function () {
        clearInterval(zoom);
    }
}
