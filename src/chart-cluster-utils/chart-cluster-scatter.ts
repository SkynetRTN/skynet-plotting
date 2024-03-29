/**
 * This file contains functions that update/scale/rescale scatter data and chart in cluster interfaces
 */


import {Chart} from "chart.js";
import Handsontable from "handsontable";
import {filterWavelength, HRrainbow, modelFormKey, pointMinMax} from "./chart-cluster-util";
import {insertGraphControl} from "./chart-cluster-interface";

/**
 *  This function updates scatter data and the boudning scale of the graph
 *  @param table:         handsontable containing the data
 *  @param myCharts:      array of chart.js objects, depends on how many you have
 *  @param dataSetIndex:  the dataset index in chart declaration: order need to be consistent with myCharts param
 *  @param graphMaxMin:   the graphScale object that contains chart bounding information
 */
export function updateScatter(
    table: Handsontable,
    myCharts: Chart[],
    clusterForm: ClusterForm,
    dataSetIndex: number[],
    graphMaxMin: graphScale,
    specificChart: number = -1,
    clusterProForm: ClusterProForm = null,
    isDiscard: boolean = false
) {

    let isRange = (document.getElementById("distrangeCheck") as HTMLInputElement).checked
    let err = parseFloat(clusterForm['err_num'].value); // 3 sigma value = 0.312347, now using user inputs
    let dist = parseFloat(clusterForm["d_num"].value);
    //as request by educator, Extinction in V (mag) is now calculated by B-V Reddening (input) * 3.1
    let reddening = parseFloat(clusterForm["red_num"].value) * 3.1;
    let rv = clusterProForm != null ? parseFloat(clusterForm["rv_num"].value) : 3.1;
    let range = parseFloat(clusterForm["distrange_num"].value);
    let isRaRange = null;
    let isDecRange = null;
    let raMotion = null;
    let raRange = null;
    let decMotion = null;
    let decRange = null;
    if (clusterProForm !== null) {
        isRaRange = (document.getElementById("rarangeCheck") as HTMLInputElement).checked
        isDecRange = (document.getElementById("decrangeCheck") as HTMLInputElement).checked
        raMotion = parseFloat(clusterProForm['ramotion_num'].value);
        raRange = parseFloat(clusterProForm['rarange_num'].value);
        decMotion = parseFloat(clusterProForm['decmotion_num'].value);
        decRange = parseFloat(clusterProForm['decrange_num'].value);
    }
    const tableData = table.getData();
    const tableSource = table.getSourceData();
    let columns = table.getColHeader();
    let keptDataIndex: number[] = [];
    let downloadData: { [key: string]: { [key: string]: string } } = {};
    for (let c = 0; c < myCharts.length; c++) {
        if (specificChart < 0 || specificChart === c) {
            let myChart = myCharts[c];

            let chart = myChart.data.datasets[dataSetIndex[c]].data;

            let blueKey = modelFormKey(c, 'blue')
            let redKey = modelFormKey(c, 'red')
            let lumKey = modelFormKey(c, 'lum')

            //Identify the column the selected filter refers to
            let blue = columns.indexOf(clusterForm[blueKey].value + " Mag");
            let red = columns.indexOf(clusterForm[redKey].value + " Mag");
            let lum = columns.indexOf(clusterForm[lumKey].value + " Mag");

            let A_v1 = calculateLambda(reddening, rv, filterWavelength[clusterForm[blueKey].value]);
            let A_v2 = calculateLambda(reddening, rv, filterWavelength[clusterForm[redKey].value]);
            let A_v3 = calculateLambda(reddening, rv, filterWavelength[clusterForm[lumKey].value]);

            let blueErr =
                columns.indexOf(clusterForm[blueKey].value + " err") < 0
                    ? null
                    : columns.indexOf(clusterForm[blueKey].value + " err"); //checks for supplied err data
            let redErr =
                columns.indexOf(clusterForm[redKey].value + " err") < 0
                    ? null
                    : columns.indexOf(clusterForm[redKey].value + " err");
            let lumErr =
                columns.indexOf(clusterForm[lumKey].value + " err") < 0
                    ? null
                    : columns.indexOf(clusterForm[lumKey].value + " err");

            let blueDist = columns.indexOf(clusterForm[blueKey].value + " dist");
            let distHighLim = (dist + (dist * (range / 100))) * 1000;
            let distLowLim = (dist - (dist * (range / 100))) * 1000;

            let bluePmra = columns.indexOf(clusterForm[blueKey].value + " pmra");
            let bluePmdec = columns.indexOf(clusterForm[blueKey].value + " pmdec");
            let pmraHighLim = raMotion + raRange;
            let pmraLowLim = raMotion - raRange;
            let pmdecHighLim = decMotion + decRange;
            let pmdecLowLim = decMotion - decRange;

            let scaleLimits: { [key: string]: number } = {minX: NaN, minY: NaN, maxX: NaN, maxY: NaN,};

            let start = 0;
            for (let i = 0; i < tableData.length; i++) {
                let isSkip = false;
                let id = tableData[i][columns.indexOf('id')]
                if (
                    typeof (tableData[i][blue]) != 'number' ||
                    typeof (tableData[i][red]) != 'number' ||
                    typeof (tableData[i][lum]) != 'number' ||
                    (blueErr != null && tableData[i][blueErr] >= err) ||
                    (redErr != null && tableData[i][redErr] >= err) ||
                    (lumErr != null && tableData[i][lumErr] >= err)
                ) {
                    isSkip = true;
                }

                if (!isSkip) {
                    let distance: number = tableData[i][blueDist];
                    let isDistNotValid = isNaN(distance) || distance === null
                    if (isRange && (isDistNotValid || (distance > distHighLim) || distance < distLowLim)) {
                        isSkip = true;
                    }
                }
                if (!isSkip && clusterProForm !== null) {
                    if (isRaRange) {
                        let pmra = tableData[i][bluePmra]
                        if (pmra > pmraHighLim || pmra < pmraLowLim) {
                            isSkip = true;
                        }
                    }
                    if (isDecRange) {
                        let pmdec = tableData[i][bluePmdec]
                        if (pmdec > pmdecHighLim || pmdec < pmdecLowLim) {
                            isSkip = true;
                        }
                    }
                }

                // if (id){
                //     if (!downloadData[id])
                //         downloadData[id] = {}
                //     downloadData[id]['id'] = id
                //     let downloadList: number[] = [blue, blueErr, red, redErr, lum, lumErr]
                //     for (let j = 0; j < downloadList.length; j++) {
                //         if (downloadList[j] !== null)
                //             downloadData[id][columns[downloadList[j]]] = tableData[i][downloadList[j]]
                //     }
                //     downloadData[id]['distance'] = tableData[i][blueDist]
                //     downloadData[id]['pmra'] = tableData[i][bluePmra]
                //     downloadData[id]['pmdec'] = tableData[i][bluePmdec]
                //     downloadData[id]['x_'+ (c+1).toString()] = ""
                //     downloadData[id]['y_' + (c+1).toString()] = ""
                // }

                if (isSkip)
                    continue

                //red-blue,lum

                let x = (tableData[i][blue] - A_v1) - (tableData[i][red] - A_v2);
                let y = (tableData[i][lum] - A_v3) - 5 * Math.log10(dist / 0.01);
                //testing purposes'
                //let x = tableData[i][blue] - (tableData[i][red]);
                //let y = tableData[i][lum] - 5 * Math.log10(dist / 0.01);


                chart[start++] = {
                    x: x,
                    y: y
                };
                scaleLimits = pointMinMax(scaleLimits, x, y);

                if (id) {
                    if (keptDataIndex.indexOf(i) < 0)
                        downloadData[id] = tableSource[i] as { [key: string]: string };

                    try {
                        downloadData[id]['x_' + (c + 1).toString()] = x.toString();
                        downloadData[id]['y_' + (c + 1).toString()] = y.toString();
                    } catch (e) {
                    }
                }

                keptDataIndex.push(i)

            }
            while (chart.length !== start) {
                chart.pop();
            }
            graphMaxMin.updateDataLimit(c, scaleLimits);
            myChart.data.datasets[dataSetIndex[c]].backgroundColor = HRrainbow(myChart, //we need to do this anyways if the chart isn't rescaled
                clusterForm[redKey].value, clusterForm[blueKey].value)
            if (graphMaxMin.getMode(c) !== null) {
                chartRescale([myChart], clusterForm, graphMaxMin, null, [c]);
            }
            myChart.update()
        }
    }
    if (clusterProForm) {
        keptDataIndex = [...new Set(keptDataIndex)];
        document.getElementById("data-count").innerHTML =
            keptDataIndex.length.toString() + '/' + tableSource.length.toString()
        if (isDiscard) {
            let newTableData = [];
            for (const kepti of keptDataIndex) {
                newTableData.push(tableSource[kepti]);
            }
            table.updateData(newTableData);
        }
    }
    // @ts-ignore
    return Object.values(downloadData)
}


/**
 * A data structure to manage the min/max of x and y value for graph scaling purpose
 */
export class graphScale {
    mode: string[] = []; //coulde be 'auto' 'data' and unused 'model'
    modelLimits: { [key: string]: number } = {minX: NaN, maxX: NaN, minY: NaN, maxY: NaN,};
    dataLimits: { [key: string]: number }[] = [];

    /**
     * Construct the graphScale object based on how many graphs need to be taken care of
     * @param chartCount
     * @constructor
     */
    constructor(chartCount: number = 1) {
        for (let i = 0; i < chartCount; i++) {
            this.mode.push('auto');
            this.dataLimits.push({minX: NaN, maxX: NaN, minY: NaN, maxY: NaN,})
        }
    }

    /**
     * update min/max coordinates for a specific chart's data based on the given coordinate
     * @param chartNum the chart need to be updated, starting from 0
     * @param coordinates the new coordinate
     */
    updateDataLimit(chartNum: number, coordinates: { [key: string]: number }) {
        this.dataLimits[chartNum] = coordinates;
    }

    /**
     * return the min/max coordinates of data of a specific chart
     * @param chartNum the chart that is being inquired
     */
    getDataLimit(chartNum: number) {
        return this.dataLimits[chartNum]
    }

    /**
     * __currently unused__
     * update min/max coordinates for chart's model based on the given coordinate
     * @param coordinates the new coordinate
     */
    updateModelLimits(coordinates: { [key: string]: number }) {
        this.modelLimits = coordinates;
    }

    /**
     * __currently unused__
     * return the min/max coordinates of model of a specific chart
     */
    getModelLimit() {
        return this.modelLimits;
    }

    /**
     * return the mode of how specific chart is framed
     * @param chartNum
     */
    getMode(chartNum: number) {
        return this.mode[chartNum];
    }

    /**
     * update the mode of how specific chart is framed
     * @param newMode the new mode in string
     * @param chartNum the chart need to be updated, starting from 0
     */
    updateMode(newMode: string, chartNum: number): string {
        this.mode[chartNum] = newMode;
        return newMode
    }
}


/**
 * A class to control chart using control buttons and mouse pan/zoom
 */
export class ChartScaleControl {
    standardViewLabel: HTMLLabelElement;
    frameOnDataLabel: HTMLLabelElement;
    standardViewRadio: HTMLInputElement;
    frameOnDataRadio: HTMLInputElement;
    panLeft: HTMLInputElement;
    panRight: HTMLInputElement;
    zoomIn: HTMLInputElement;
    zoomOut: HTMLInputElement;
    charts: Chart [];
    chartCount: number;
    clusterForm: ClusterForm;
    chartScale: graphScale;
    chartRadios: HTMLInputElement[] = [];
    chartLabels: HTMLLabelElement[] = [];
    onControl: boolean[] = [];

    /**
     * Construct an object to control chart using control buttons and mouse pan/zoom
     * @param charts array of charts need to be controlled
     * @param clusterForm the clusterForm of parameters
     * @param chartScale the graphScale object that specifies how the charts are framed
     * @constructor
     */
    constructor(charts: Chart [], clusterForm: ClusterForm, chartScale: graphScale) {
        this.charts = charts;
        this.clusterForm = clusterForm;
        this.chartScale = chartScale;
        this.chartCount = charts.length;
        insertGraphControl(this.chartCount);
        this.standardViewLabel = document.getElementById("standardViewLabel") as HTMLLabelElement;
        this.frameOnDataLabel = document.getElementById("frameOnDataLabel") as HTMLLabelElement;
        this.standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
        this.frameOnDataRadio = document.getElementById("frameOnData") as HTMLInputElement;
        this.panLeft = document.getElementById("panLeft") as HTMLInputElement;
        this.panRight = document.getElementById("panRight") as HTMLInputElement;
        this.zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
        this.zoomOut = document.getElementById('zoomOut') as HTMLInputElement;

        if (this.chartCount > 1) {
            this.frameChartAddEventListner();
            this.chartLabels[0].click();
        } else {
            this.onControl.push(true);
            this.radioAddEventListener();
            this.panAddEventListener();
            this.zoomAddEventListener();
        }
    }

    static zoompanDeactivate() {
        throw new Error("Method not implemented.");
    }

    //zoom pan helper function: run an array of function one by one
    run(funcs: Function[]) {
        for (let i = 0; i < funcs.length; i++) {
            funcs[i]();
        }
    }

    //zoom pan helper function: clear an array of interval one by one
    clear(numbs: number[]) {
        for (let i = 0; i < numbs.length; i++) {
            clearInterval(numbs[i])
        }
    }

    /**
     * Unchecked and reset both radio buttons to white background
     * @param clusterForm clusterForm of parameters
     * @param chartNum the chart need to be updated, starting from 0
     */
    zoompanDeactivate(clusterForm: ClusterForm, chartNum: number = 0): any {
        this.chartScale.updateMode(null, chartNum);
        if (this.onControl[chartNum]) {
            this.standardViewRadio.checked = false;
            this.frameOnDataRadio.checked = false;
            this.setRadioLabelColor(this.standardViewRadio, false);
            this.setRadioLabelColor(this.frameOnDataRadio, false);
        }
        for (let i = 0; i < this.chartCount; i++) {
            let chart = this.charts[i];
            setTimeout(function () {
                chart.data.datasets[2].backgroundColor = HRrainbow(chart,
                    clusterForm[modelFormKey(i, "red")].value, clusterForm[modelFormKey(i, "blue")].value)
                chart.update()
            }, 5)
        }
    }

    /**
     * Add eventlisteners for all buttons
     * @private
     */
    private frameChartAddEventListner() {
        for (let i = 0; i < this.chartCount; i++) {
            let label = document.getElementById("frameChart" + (i + 1).toString()) as HTMLLabelElement
            this.chartLabels.push(label);
            this.chartRadios.push(document.getElementById("radioChart" + (i + 1).toString()) as HTMLInputElement)
            this.onControl.push(false);
            label.onmouseover = () => {
                this.labelOnHover(label)
            };
            label.onmouseleave = () => {
                this.labelOffHover(label)
            };
            label.onclick = () => {
                for (let j = 0; j < this.chartCount; j++) {
                    if (j !== i) {
                        this.onControl[j] = false
                        this.chartRadios[j].checked = false;
                        this.setLabelColor(this.chartLabels[j], false)
                    } else {
                        this.onControl[j] = true
                        this.chartRadios[j].checked = true;
                        this.setLabelColor(this.chartLabels[j], true)
                    }
                }
                this.radioAddEventListener();
                this.panAddEventListener();
                this.zoomAddEventListener();
                if (this.chartScale.getMode(i) === 'auto') {
                    this.standardViewLabel.click();
                } else if (this.chartScale.getMode(i) === 'data') {
                    this.frameOnDataLabel.click();
                } else {
                    this.zoompanDeactivate(this.clusterForm, i);
                }
            };
            this.charts[i].options.onClick = () => {
                label.click()
            }
        }
    }

    /**
     * Add eventlisteners for radio buttons that select which graph to control
     * Onclick: highlight the clicked button and unhighlight others, then initialize the control buttons
     * Onhover: turn the background to grey
     * @private
     */
    private radioAddEventListener() {
        let standardFuncs: Function[] = [];
        let frameOnFuncs: Function[] = [];
        let run = this.run;
        for (let i = 0; i < this.chartCount; i++) {
            if (this.onControl[i]) {
                standardFuncs.push(() => {
                    this.radioOnclick(this.standardViewRadio, this.frameOnDataRadio, this.chartScale, i);
                });
                frameOnFuncs.push(() => {
                    this.radioOnclick(this.frameOnDataRadio, this.standardViewRadio, this.chartScale, i);
                });
            }
        }

        this.standardViewLabel.onclick = () => {
            run(standardFuncs)
        };
        this.frameOnDataLabel.onclick = () => {
            run(frameOnFuncs)
        };
        this.standardViewLabel.onmouseover = () => {
            this.labelOnHover(this.standardViewLabel)
        };
        this.standardViewLabel.onmouseleave = () => {
            this.labelOffHover(this.standardViewLabel)
        };
        this.frameOnDataLabel.onmouseover = () => {
            this.labelOnHover(this.frameOnDataLabel)
        };
        this.frameOnDataLabel.onmouseleave = () => {
            this.labelOffHover(this.frameOnDataLabel)
        };
    }

    /**
     * Add eventlisteners to the panning button: shift graph along x-axis
     * @private
     */
    private panAddEventListener() {
        let panLeftFunctions: Function[] = [];
        let panRightFunctions: Function[] = [];
        let pans: number[] = [];
        let run = this.run;
        let clear = this.clear;
        for (let i = 0; i < this.chartCount; i++) {
            if (this.onControl[i]) {
                let chart = this.charts[i];
                pans.push(0)
                panLeftFunctions.push(
                    () => {
                        pans[i] = setInterval(() => {
                            chart.pan(-5)
                        }, 20);
                    }
                )
                panRightFunctions.push(
                    () => {
                        pans[i] = setInterval(() => {
                            chart.pan(5)
                        }, 20);
                    }
                )
            }
        }
        this.panLeft.onmousedown = function () {
            run(panLeftFunctions);
        }
        this.panRight.onmousedown = function () {
            run(panRightFunctions);
        }
        this.panLeft.onmouseup = this.panLeft.onmouseleave = function () {
            clear(pans);
        }
        this.panRight.onmouseup = this.panRight.onmouseleave = function () {
            clear(pans);
        }
    }

    /**
     * Add eventlisteners to the zooming button: zoom graph along x-axis
     * @private
     */
    private zoomAddEventListener() {
        let zoomInFunctions: Function[] = [];
        let zoomOutFunctions: Function[] = [];
        let zooms: number[] = [];
        let run = this.run;
        let clear = this.clear;
        for (let i = 0; i < this.chartCount; i++) {
            if (this.onControl[i]) {
                let chart = this.charts[i];
                zooms.push(0)
                zoomInFunctions.push(
                    () => {
                        zooms[i] = setInterval(() => {
                            chart.zoom(1.03)
                        }, 20);
                    }
                )
                zoomOutFunctions.push(
                    () => {
                        zooms[i] = setInterval(() => {
                            chart.zoom(0.97)
                        }, 20);
                    }
                )
            }
        }
        this.zoomIn.onmousedown = function () {
            run(zoomInFunctions);
        }
        this.zoomOut.onmousedown = function () {
            run(zoomOutFunctions);
        }
        this.zoomIn.onmouseup = this.zoomIn.onmouseleave = function () {
            clear(zooms);
        }
        this.zoomOut.onmouseup = this.zoomOut.onmouseleave = function () {
            clear(zooms);
        }
    }

    /**
     * The event that would happen when framing option radio buttons are clicked
     * only one option can be selected at one time
     * The selected option is highlighted by making the background Carolina blue
     * @param radioOnClicked the radio button that is clicked
     * @param otherRadio the other radio button that is not clicked
     * @param graphMaxMin the graphScale object that provides scaling parameters
     * @param chartNum the chart need to be updated, starting from 0
     * @private
     */
    private radioOnclick(radioOnClicked: HTMLInputElement, otherRadio: HTMLInputElement, graphMaxMin: graphScale, chartNum: number): any {
        radioOnClicked.checked = true;
        this.setRadioLabelColor(radioOnClicked, true)
        otherRadio.checked = false;
        this.setRadioLabelColor(otherRadio, false)
        graphMaxMin.updateMode(radioOnClicked.id === "standardView" ? "auto" : "data", chartNum)
        chartRescale([this.charts[chartNum]], this.clusterForm, this.chartScale, null, [chartNum]);
        this.recoloring()
    }

    /**
     * Alter radio input background color between Carolina blue and white
     * @param radio the radio button that needs to be updated
     * @param activate whether the radio should be active or not
     * @private
     */
    private setRadioLabelColor(radio: HTMLInputElement, activate: boolean) {
        let radioLabel: HTMLLabelElement = document.getElementById(radio.id + "Label") as HTMLLabelElement
        radioLabel.style.backgroundColor = activate ? "#4B9CD3" : "white";
        radioLabel.style.opacity = activate ? "1" : "0.7";
    }

    /**
     * Alter radio label font opacity between 1 and 0.7
     * @param radio the radio button that needs to be updated
     * @param activate whether the radio should be active or not
     * @private
     */
    private setLabelColor(label: HTMLLabelElement, activate: boolean) {
        label.style.backgroundColor = activate ? "#4B9CD3" : "white";
        label.style.opacity = activate ? "1" : "0.7";
    }

    /**
     * Make the radio button background opacity on hover change to 1
     * @param label label that opacity need to change
     * @private
     */
    private labelOnHover(label: HTMLLabelElement) {
        if (label.style.backgroundColor === "white" || label.style.backgroundColor === "#FFFFFF" || label.style.backgroundColor === "") {
            label.style.backgroundColor = "#E7E7E7";
        }
        label.style.opacity = "1";
    }

    /**
     * Make the radio button background opacity off hover change to 0.7
     * @param label label that opacity need to change
     * @private
     */
    private labelOffHover(label: HTMLLabelElement) {
        if (label.style.backgroundColor === "rgb(231, 231, 231)") {
            label.style.backgroundColor = "white";
            label.style.opacity = "0.7";
        }

    }

    /**
     * Reassign color of the framing option button when on control radio buttons are switched
     * @private
     */
    private recoloring() {
        for (let i = 0; i < this.chartCount; i++) {
            let chart = this.charts[i];
            chart.data.datasets[2].backgroundColor = HRrainbow(chart,
                this.clusterForm[modelFormKey(i, "red")].value, this.clusterForm[modelFormKey(i, "blue")].value)
        }
    }
}

/**
 *  This function rescale the chart
 *  @param myCharts:    array of charts that need to be rescaled
 *  @param clusterForm:   clusterForm that provides filter information
 *  @param graphMaxMin: the graphScale object
 *  @param option: overwrite the existing zooming option
 */
function chartRescale(myCharts: Chart[],
                      clusterForm: ClusterForm,
                      graphMaxMin: graphScale,
                      option: string = null,
                      scaleIndexOverride: number[] = []) {
    for (let c = 0; c < myCharts.length; c++) {
        let myChart = myCharts[c];
        let adjustScale: { [key: string]: number } = {minX: 0, minY: 0, maxX: 0, maxY: 0,};
        let xBuffer: number = 0;
        let yBuffer: number = 0;
        let adjustedC = scaleIndexOverride.length === 0 ? c : scaleIndexOverride[c];
        for (let key in adjustScale) {
            let frameOn: string = option === null ? graphMaxMin.getMode(adjustedC) : graphMaxMin.updateMode(option, adjustedC);
            if (frameOn === "auto") {
                let filters: { [key: string]: string } = {
                    'red': clusterForm[modelFormKey(adjustedC, 'red')].value,
                    'blue': clusterForm[modelFormKey(adjustedC, 'blue')].value,
                    'lum': clusterForm[modelFormKey(adjustedC, 'lum')].value
                }

                const mags: { [key: string]: { [key: string]: number } } = {
                    "U": {"red": 11.72, "faint": 11.72, "blue": -4.49, "bright": -10.57},
                    "B": {"red": 10.72, "faint": 10.72, "blue": -3.34, "bright": -10.6},
                    "V": {"red": 9.38, "faint": 9.38, "blue": -3.04, "bright": -10.67},
                    "R": {"red": 8.45, "faint": 8.45, "blue": -2.92, "bright": -10.88},
                    "I": {"red": 7.69, "faint": 7.69, "blue": -2.75, "bright": -11.25},
                    "u'": {"red": 12.55, "faint": 12.55, "blue": -3.78, "bright": -9.66},
                    "g'": {"red": 10.13, "faint": 10.13, "blue": -3.36, "bright": -10.74},
                    "r'": {"red": 8.8, "faint": 8.8, "blue": -2.84, "bright": -10.68},
                    "i'": {"red": 8.26, "faint": 8.26, "blue": -2.47, "bright": -10.79},
                    "z'": {"red": 7.93, "faint": 7.93, "blue": -2.13, "bright": -10.87},
                    "J": {"red": 6.67, "faint": 6.67, "blue": -2.42, "bright": -11.82},
                    "H": {"red": 6.1, "faint": 6.1, "blue": -2.28, "bright": -12.18},
                    "K": {"red": 5.92, "faint": 5.92, "blue": -2.19, "bright": -12.24},
                    "W1": {"red": 5.7, "faint": 5.7, "blue": -2.11, "bright": -12.3},
                    "W2": {"red": 5.58, "faint": 5.58, "blue": -2.07, "bright": -12.33},
                    "W3": {"red": 5.52, "faint": 5.52, "blue": -3.31, "bright": -12.31},
                    "W4": {"red": 5.19, "faint": 5.19, "blue": -3.13, "bright": -12.62},
                    "BP": {"red": 9.57, "faint": 9.57, "blue": -3.3, "bright": -10.67},
                    "G": {"red": 8.73, "faint": 8.73, "blue": -3.13, "bright": -10.76},
                    "RP": {"red": 7.83, "faint": 7.83, "blue": -2.82, "bright": -11.18},
                }

                let color_red: number = mags[filters['blue']]['red'] - mags[filters['red']]['red'];
                let color_blue: number = mags[filters['blue']]['blue'] - mags[filters['red']]['blue'];

                let minX = color_blue - (color_red - color_blue) / 8;
                let maxX = color_red + (color_red - color_blue) / 8;
                adjustScale = {
                    'minX': minX <= maxX ? minX : maxX,
                    'maxX': maxX >= minX ? maxX : minX,
                    'minY': mags[filters['lum']]['bright'] + (mags[filters['lum']]['bright'] - mags[filters['red']]['faint']) / 8,
                    'maxY': mags[filters['lum']]['faint'] - (mags[filters['lum']]['bright'] - mags[filters['lum']]['faint']) / 8,

                };
            } else {
                if (frameOn === "both") {
                    if (key.includes('min')) {
                        adjustScale[key] = Math.min(graphMaxMin.getDataLimit(adjustedC)[key],
                            graphMaxMin.getModelLimit()[key]);
                    } else {
                        adjustScale[key] = Math.max(graphMaxMin.getDataLimit(adjustedC)[key],
                            graphMaxMin.getModelLimit()[key]);
                    }
                } else if (frameOn === "data") {
                    adjustScale[key] = graphMaxMin.getDataLimit(adjustedC)[key];
                } else if (frameOn === "model") {
                    adjustScale[key] = graphMaxMin.getModelLimit()[key];
                }

                xBuffer = (adjustScale["maxX"] - adjustScale["minX"]) * 0.2;
                yBuffer = (adjustScale["maxY"] - adjustScale["minY"]) * 0.2;
                let minbuffer = 0.1;
                let maxbuffer = 1;
                xBuffer = (xBuffer > minbuffer ? (xBuffer < maxbuffer ? xBuffer : maxbuffer) : minbuffer)
                yBuffer = (yBuffer > minbuffer ? (yBuffer < maxbuffer ? yBuffer : maxbuffer) : minbuffer)
            }
            if (isNaN(adjustScale[key])) {
            }
            adjustScale[key] = isNaN(adjustScale[key]) ? 0 : adjustScale[key]
        }

        myChart.options.scales["y"].min = adjustScale["minY"] - yBuffer
        myChart.options.scales["y"].max = adjustScale["maxY"] + yBuffer
        myChart.options.scales["y"].reverse = true

        myChart.options.scales["x"].min = adjustScale["minX"] - xBuffer
        myChart.options.scales["x"].max = adjustScale["maxX"] + xBuffer
        myChart.options.scales["x"].type = "linear"

        myChart.data.datasets[2].backgroundColor = HRrainbow(myChart,
            clusterForm[modelFormKey(adjustedC, 'red')].value, clusterForm[modelFormKey(adjustedC, 'blue')].value)
        myChart.update()
    }
}

/**
 * Calculate actual wavlength based on filter and reddening parameters.
 * @param A_v The reddening value based on user input
 * @param filterlambda the wavelength of the filter in meter
 */
export function calculateLambda(A_v: number, R_v: number, filterlambda = 10 ** -6) {
    let lambda = filterlambda;
    let x = (lambda / 1) ** -1;
    let y = x - 1.82;
    let a = 0;
    let b = 0;
    if (x > 0.3 && x < 1.1) {
        a = 0.574 * x ** 1.61;
    } else if (x > 1.1 && x < 3.3) {
        a =
            1 +
            0.17699 * y -
            0.50447 * y ** 2 -
            0.02427 * y ** 3 +
            0.72085 * y ** 4 +
            0.01979 * y ** 5 -
            0.7753 * y ** 6 +
            0.32999 * y ** 7;
    }

    if (x > 0.3 && x < 1.1) {
        b = -0.527 * x ** 1.61;
    } else if (x > 1.1 && x < 3.3) {
        b =
            1.41338 * y +
            2.28305 * y ** 2 +
            1.07233 * y ** 3 -
            5.38434 * y ** 4 -
            0.62251 * y ** 5 +
            5.3026 * y ** 6 -
            2.09002 * y ** 7;
    }

    return Number(A_v) * (a + b / R_v);
}
