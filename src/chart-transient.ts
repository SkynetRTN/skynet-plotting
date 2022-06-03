'use strict';

//import Chart from "chart.js/auto";
import "chartjs-chart-error-bars";
import Handsontable from "handsontable";

import { initHTML, disableDropdown } from "./chart-transient-utils/chart-transient-html";
import { TransientChart } from "./chart-transient-utils/chart-transient-chart";
import { readCSVData, verifyCSV } from "./chart-transient-utils/chart-transient-file"; 
import { tableCommonOptions } from "./config"
import { linkInputs, updateTableHeight, sanitizeTableData } from "./util"
import { calculateLambda, filterWavelength } from "./chart-cluster-utils/chart-cluster-util";
import { LinearScaleOptions } from "chart.js";

// enables certain print statements when true
const DEBUG = false;

/*
    HANDLE USER INPUT
*/
const findDelimiter = (s: string) => {
    let plus = false;
    let minus = false;

    if (/[+]/g.test(s)) {
        plus = true;
    }
    if (/[-]/g.test(s)) {
        minus = true;
    }
    if (plus && !minus) {
        return '+';
    }
    if (!plus && minus) {
        return '-';
    }
    return null;
}


const shiftMagnitudes = (myChart: TransientChart, form: ChartInfoForm) => {
    if (DEBUG) { console.log(':: SHIFT MAGNITUDES START ::'); }

    const unparsedData = form.elements['data'].value.split(',');
    if (unparsedData.length > 500) {
        alert('Too many characters in Data field!');
        return;
    }

    // get updated filters and check if valid inputs
    let shiftedFilters = new Map();
    for (let unparsedDatum of unparsedData) {
        unparsedDatum = unparsedDatum.trim();

        let delim = findDelimiter(unparsedDatum);
        let sign = delim === '+' ? 1 : -1;

        if (delim === null || unparsedDatum.split(delim).length > 2) {
            continue;
        }

        let updatedFilter = unparsedDatum.split(delim)[0];
        let shiftVal = parseFloat(unparsedDatum.split(delim)[1]);

        if (isNaN(shiftVal)) { continue; }
        if (shiftVal > 100 || shiftVal < -100) {
            alert('Magnitudes can only be shifted +/- 100');
            continue;
        }
        
        // map of valid updated values
        if (!shiftedFilters.has(updatedFilter)) {
            shiftedFilters.set(updatedFilter, sign*shiftVal);
        }
    }
    //

    // shift with the given valid data
    let TYPE = {};
    let x = "x" as keyof typeof TYPE;
    let y = "y" as keyof typeof TYPE;
    let filters = shiftedFilters.keys();

    for (let filter of filters) {
        let newShiftVal = shiftedFilters.get(filter);
        let change = newShiftVal - myChart.getMagShift(filter);
        if (isNaN(change)) { // no prior shift info
            change = newShiftVal;
        }

        for (let i = 0; i < myChart.getDatasets().length; i++) {
            let label = myChart.getDataset(i).label;

            if (label.includes(filter)) {
                if (change !=0) {
                    let shiftedData = [];
                    for (let j=0; j < myChart.getDataset(i).data.length; j++) {
                        shiftedData.push({
                            x: myChart.getDataset(i).data[j][x],
                            y: myChart.getDataset(i).data[j][y] + change
                        })
                    }
                    myChart.clearDataFromDataset(i);
                    myChart.updateDataFromDataset(shiftedData, i);

                    // update label for data only
                    if (!label.includes("error") && !label.includes("model")) {
                        let operation = newShiftVal < 0 ? '' : '\+'; 
                        let newLabel = filter + operation + String(newShiftVal);
                        myChart.getDataset(i).label = newLabel;
                    }
                }
            }
        }
        myChart.setMagShift(filter, shiftedFilters.get(filter));
        myChart.update();
    }
    if (DEBUG) { console.log(':: SHIFT MAGNITUDES END ::'); }
    //
}

// internal
const updateLabels = (myChart: TransientChart, form: ChartInfoForm) => {
    if (DEBUG) { console.log(':: UPDATE LABELS START ::'); }
    let labels = "";
    for (let i = 0; i < myChart.getDatasets().length; i++) {
        let labelToBeAdded = myChart.getDataset(i).label;
        if (!labelToBeAdded.includes("model") && !labelToBeAdded.includes("error")) {
            if (labels !== "") {
                labels += ", ";
            }
            labels += labelToBeAdded;
        }
    }
    form.elements['data'].value = labels;
    myChart.chart.options.plugins.title.text = form.elements['title'].value;
    (myChart.chart.options.scales['x'] as LinearScaleOptions).title.text = form.elements['xAxis'].value;
    (myChart.chart.options.scales['y'] as LinearScaleOptions).title.text = form.elements['yAxis'].value;
    myChart.update();

    if (DEBUG) { console.log(':: UPDATE LABELS END ::'); }
}


const handleDropdownInput = (chart: TransientChart) => {
    const dropdown = document.getElementById('temporal') as HTMLSelectElement;
    dropdown.onchange = () => {
        const sel = dropdown.selectedIndex;
        const opt = dropdown.options[sel];
        const temporalModel = (<HTMLOptionElement>opt).value

        chart.setScaleType(temporalModel);
    }

    const spectralDD = document.getElementById('spectral') as HTMLSelectElement;
    spectralDD.onchange = () => {
        const sel = spectralDD.selectedIndex;
        const opt = spectralDD.options[sel];
        const spectralModel = (<HTMLOptionElement>opt).value

        if (spectralModel === 'Power Law') {
            disableDropdown('ebv', true);
        } else {
            disableDropdown('ebv', false);
        }
    }
}


const handleEventTimeInput = (chart: TransientChart) => {
    const eventTimeInput = document.getElementById('time') as HTMLInputElement;

    eventTimeInput.oninput = () => {
        if (eventTimeInput.value === '') {
            return;
        } 
        const eventTime = parseFloat(eventTimeInput.value);
        if (eventTime < 0 || isNaN(eventTime)) {
            return;
        }
        chart.shiftData("x", eventTime);
        chart.update();
    }
}


const handleChartZoomOptions = (chart: TransientChart) => {
    let Reset = document.getElementById("Reset") as HTMLInputElement;
    let panLeft = document.getElementById("panLeft") as HTMLInputElement;
    let panRight = document.getElementById("panRight") as HTMLInputElement;
    let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
    let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;

    const myChart = chart.chart;
    let pan: number;

    panLeft.onmousedown = function() {
        pan = setInterval( () => {chart.chart.pan(5)}, 20 )
    }
    panLeft.onmouseup = panLeft.onmouseleave = function() {
        clearInterval(pan);
    }
    panRight.onmousedown = function() {
        pan = setInterval( () => {chart.chart.pan(-5)}, 20 )
      }
    panRight.onmouseup = panRight.onmouseleave = function() {
        clearInterval(pan);
    }

    Reset.onclick = function(){
        chart.resetView();
        chart.update();
    }

    let zoom: number;
    zoomIn.onmousedown = function () {
    zoom = setInterval(() => { myChart.zoom(1.03) }, 20);;
    }
    zoomIn.onmouseup = zoomIn.onmouseleave = function () {
    clearInterval(zoom);
    }
    zoomOut.onmousedown = function () {
    zoom = setInterval(() => { myChart.zoom(0.97); }, 20);
    }
    zoomOut.onmouseup = zoomOut.onmouseleave = function () {
    clearInterval(zoom);
    }
}


const updateCurve = (myChart: TransientChart, form: VariableLightCurveForm) => {

    let tempData: Array<{x: number, y: number}> = [];
    let buffer = (myChart.getMaxMJD() - myChart.getMinMJD())*0.5;
    let range = [Math.max(myChart.getMinMJD() - 10., 0.1), myChart.getMaxMJD() + buffer];

    for (let i = 0; i < myChart.getDatasets().length; i++) {
        tempData = [];
        let label = myChart.getDataset(i).label;
        let delim = findDelimiter(label);
        let filter = label.split(delim)[0];
        let magShift = myChart.getMagShift(filter) ? myChart.getMagShift(filter): 0;
        if (label.includes("model")) {
            // let filter = label.split('-')[0];
            for (let j = 0; j < range.length; j++) {
                let mjd = range[j];
                let newMag = calculateModel(form, filter, mjd) + magShift;
                tempData.push({
                    x: mjd,
                    y: newMag,
                });
            }
            myChart.clearDataFromDataset(i);
            myChart.updateDataFromDataset(tempData, i);
        }
        myChart.update();
    }
}

// 
function handleTableUpdate(table: Handsontable, myChart: TransientChart) {
    if (DEBUG) { console.log('Handling update to table..'); }

    // can't pass filter col ([2]) to sanitize since is string
    const tableData = sanitizeTableData(table.getData(), [0, 1]);

    const form = document
        .getElementById('chart-info-form') as ChartInfoForm;

    setChartBoundaries(myChart, table);

    // TODO: Check if ths makes sense + put into function
    let timeShift = myChart.getMinMJD() - ((myChart.getMaxMJD() - myChart.getMinMJD())*0.1);
    if (timeShift < 0) { timeShift = 0; }

    myChart.setTimeShift(timeShift);
    if (isNaN(myChart.eventShift)) {
        myChart.eventShift = 0;
    }
    //

    // get data from table
    const filterMappedData = new Map();
    for (let i = 0; i < tableData.length; i++) {
        let julianDate = tableData[i][0] - timeShift;
        let magnitude = tableData[i][1];
        let filter = tableData[i][2];

        filter = formatFilterName(filter);

        if (!filterMappedData.has(filter)) {
            filterMappedData.set(filter, []);
        }
        if (myChart.getMagShift(filter)) {
            magnitude += myChart.getMagShift(filter);
        }
        filterMappedData.get(filter).push([julianDate, magnitude]);
    }

    // should we allow user to add custom filters ?
    const supportedFilters = [] as string[];
    Object.keys(FILTERCOLORS).forEach(key => {
        supportedFilters.push(key);
    }); // unused for now

    // update min/max give nthe shift value
    myChart.setMinMJD(myChart.getMinMJD() - timeShift);
    myChart.setMaxMJD(myChart.getMaxMJD() - timeShift);

    addChartData(myChart, filterMappedData, 0);
    createModelSliders(myChart);
    addModel(filterMappedData, myChart);
    updateLabels(myChart, form);

    myChart.setReverseScale(true);
    myChart.update();
}


/*//
    INITIALIZE WEBPAGE COMPONENTS
*/
const initialize = () => {
    initHTML();
    const data  = initData();
    const table = initTable(data.table);
    const chart = initChart(data.chart);
    initModel(data.chart, chart, table);

    return {table, chart};
}

const initData = () => {
    const NUMOFPOINTS = 14;
    const dummyData = generateDummyData(NUMOFPOINTS);
    const mappedDummyData = mapDummyData(dummyData);

    return {table: dummyData, chart: mappedDummyData};
}

// Handsontable
const initTable = (data: {jd: number, magnitude: number, filter: string}[]) => {
    const container = document.getElementById('table-div');
    return new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: data,
        colHeaders: ['Julian Date', 'Magnitude', 'Filter'],
        maxCols: 3,
        columns: [
            { data: 'jd', type: 'numeric', numericFormat: {pattern: {mantissa: 2}} },
            { data: 'magnitude', type: 'numeric', numericFormat: {pattern: {mantissa: 2}} },
            { data: 'filter', type: 'text' },
        ],
    }));
}

// ChartJS
const initChart = (mappedData: Map<any, any>) => {
    const chartInfoForm = document
        .getElementById('chart-info-form') as ChartInfoForm;
    updateDataField(mappedData, chartInfoForm);

    const chart = new TransientChart();
    chart.initialize();
    addChartData(chart, mappedData, 0);

    return chart;
}

// chi-by-eye model
const initModel = (data: Map<any, any>, chart: TransientChart, table: Handsontable) => {
    setChartBoundaries(chart, table);
    createModelSliders(chart);
    addModel(data, chart);
}

// dummy data formatted for table
const generateDummyData = (numOfPoints: number) => {
    // dummy filters
    const filters = ['B', 'V', 'R', 'I'];

    let data = [];
    for (let i=0; i < numOfPoints; i++)  {
        let idx = Math.floor(Math.random() * filters.length);

        data.push({
            'jd': i * 10 + Math.random() * 10,
            'magnitude': Math.random() * 20,
            'filter': filters[idx],
        });
        
    }
    return data;
}

// dummy data formatted for chart
const mapDummyData = (data: {jd: number, magnitude: number, filter: string}[]) => {

    let filters = [] as string[];
    for (let i = 0; i < data.length; i++) {
        if (!filters.some(f => f === data[i].filter)) {
            filters.push(data[i].filter);  
        }
    }

    let mappedData = new Map();
    filters.forEach(f => {
        if (!mappedData.has(f)) {
            mappedData.set(f, []);
        }
        for (let i = 0; i < data.length; i++) {
            if (f === data[i].filter) {
                mappedData.get(f).push([
                    data[i].jd, data[i].magnitude
                ]);
            }
        }
    });
    return mappedData;
}

// fill in the data html element
const updateDataField = (data: Map<any, any>, form: ChartInfoForm) => {
    let labels = "";
    const itr = data.keys();
    // change this to grab unique filters from table
    for (let key of itr) {
        if (labels !== '') {
            labels += ', ';
        }
        labels += key;
        labels += '+0';
    }
    form.elements['data'].value = labels;
}

// form elements relevant to model
const createModelSliders = (chart: TransientChart) => {
    const parameterForm = document
        .getElementById('transient-form') as VariableLightCurveForm;
    const tAvg = (chart.getMinMJD() + chart.getMaxMJD()) / 2.
    const mAvg = (chart.getMinMag() + chart.getMaxMag()) / 2.

    linkInputs(parameterForm["b"], parameterForm["b_num"], -2, 1, 0.01, -0.5, false);
    linkInputs(parameterForm["ebv"], parameterForm["ebv_num"], 0, 1, 0.01, 0, false);
    linkInputs(parameterForm["t"], parameterForm["t_num"], chart.getMinMJD(), 
        chart.getMaxMJD(), 0.01, tAvg, false);
    linkInputs(parameterForm["mag"], parameterForm["mag_num"], chart.getMinMag(),
        chart.getMaxMag(), 0.01, mAvg, false);
    linkInputs(parameterForm["a"], parameterForm["a_num"], -3, 1, 0.01, -1, false);
}


// 
const addModel = (data: Map<any, any>, chart: TransientChart) => {
    const parameterForm = document
        .getElementById('transient-form') as VariableLightCurveForm;

    let tmp: Array<{x: number, y: number}> = [];
    const itr = data.keys();

    let lowerBound = 0.1;
    if (chart.getMinMJD() > 0) {
        lowerBound = chart.getMinMJD();
    }

    let buffer = (chart.getMaxMJD() - chart.getMinMJD())*0.5;
    let range = [Math.min(lowerBound, 0.1), chart.getMaxMJD() + buffer];
    //
    chart.chart.options.scales["x"].max = range[1];
    //
    for (let i = 0; i < data.size; i++) {
        let key = itr.next().value;

        tmp = [];
        let magShift = chart.getMagShift(key) ? chart.getMagShift(key): 0;
        for (let j = 0; j < range.length; j++) {
            tmp.push({
                x: range[j],
                y: calculateModel(parameterForm, key, range[j])+magShift,
            });
        }
        if (key === 'gprime') {
            key = 'g\'';
        }
        chart.addDataset({
            label: key+"-model",
            data: tmp,
            backgroundColor: FILTERCOLORS[key],
            borderColor: FILTERCOLORS[key],
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBorderWidth: 0,
            hidden: false,
            showLine:true,
            spanGaps: false,
            parsing: {},
        });
    }
}

// chi-by-eye curve
const calculateModel = (form: VariableLightCurveForm, filter: string, currentTime: number) => {
    const a = parseFloat(form["a_num"].value);
    const b = parseFloat(form["b_num"].value);
    const t0 = parseFloat(form["t_num"].value);
    const Av = parseFloat(form["ebv_num"].value);
    const refFilter = form["filter"].value;
    const refMagnitude = parseFloat(form["mag_num"].value);
    const eventTime = 0;//parseFloat(form["time"].value);
    
    const f  = filterWavelength[filter];
    const f0 = filterWavelength[refFilter];
    const Rv = 3.1;

    const FZP0 = ZERO_POINT_VALUES[refFilter];
    const FZP = ZERO_POINT_VALUES[filter];
    // const F0 = FZP0 * 10**((refMagnitude)/2.5);
    const td = currentTime - eventTime;// is this event - data or t) - data
    const Anu = calculateLambda(Av*Rv, filterWavelength[refFilter]);

    // const eq1 = Math.log10(F0) - Math.log10(FZP0) + Math.log10(FZP);
    const eq1 = Math.log10(FZP0) - Math.log10(FZP);
    const eq2 = a * (Math.log10(td) - Math.log10(t0));
    const eq3 = b * (Math.log10(f0) - Math.log10(f)); // these are actually wavelengths!
    const eq4 = Anu / 2.5;

    if (DEBUG) {
        console.log('Flux term: ', eq1);
        console.log('Time term: ', eq2);
        console.log('Frequency term: ', eq3);
        console.log('Extinction term: ', eq4);
        console.log('Combined: ', refMagnitude - 2.5 * (eq1 + eq2 + eq3 - eq4));
        console.log('-');
    }
    return refMagnitude - (2.5 * (eq1 + eq2 + eq3 - eq4));
}

// min/max mjd and magnitude
const setChartBoundaries = (chart: TransientChart, table: Handsontable) => {
    const tableData = sanitizeTableData(table.getData(), [0, 1]);
    chart.setMinMJD(Number.POSITIVE_INFINITY);
    chart.setMaxMJD(0);

    let minMJD = chart.getMinMJD();
    let maxMJD = chart.getMaxMJD();
    let minMag = chart.getMinMag();
    let maxMag = chart.getMaxMag();

    for (let i = 0; i < tableData.length; i++) {
        minMJD = Math.min(minMJD, tableData[i][0]);
        maxMJD = Math.max(maxMJD, tableData[i][0]);
        minMag = Math.min(minMag, tableData[i][1]);
        maxMag = Math.max(maxMag, tableData[i][1]);
    }
    chart.setMinMJD(minMJD);
    chart.setMaxMJD(maxMJD);
    chart.setMinMag(minMag);
    chart.setMaxMag(maxMag);
}


/*
    DRIVER 
*/
export function transient(): [Handsontable, TransientChart] {

    /* INITIALIZE WEBPAGE COMPONENTS */
    let init = initialize()
    const myTable = init.table;
    const myChart = init.chart;

    /* HANDLE USER INPUT */
    const chartInfoForm = document
        .getElementById('chart-info-form') as ChartInfoForm;
    const parameterForm = document
        .getElementById('transient-form') as VariableLightCurveForm;

    // condense these
    chartInfoForm.elements['data'].oninput = () => {
        shiftMagnitudes(myChart, chartInfoForm);
    }
    chartInfoForm.elements['title'].oninput = () => {
        updateLabels(myChart, chartInfoForm);
    }
    chartInfoForm.elements['xAxis'].oninput = () => {
        updateLabels(myChart, chartInfoForm);
    }
    chartInfoForm.elements['yAxis'].oninput = () => {
        updateLabels(myChart, chartInfoForm);
    }

    // update chart
    parameterForm.oninput = () => {
        handleDropdownInput(myChart);
        handleEventTimeInput(myChart);
        updateCurve(myChart, parameterForm);
        myChart.update();
    }

    // update table
    const update = function () {
        handleTableUpdate(myTable, myChart);
        updateTableHeight(myTable);
    }

    myTable.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    handleChartZoomOptions(myChart);
    handleTableUpdate(myTable, myChart);
    updateTableHeight(myTable);
    myChart.update();

    return [myTable, myChart];
}

/*
    FILE UPLOAD
*/
export function transientFileUpload(evt: Event, table: Handsontable, myChart: TransientChart) {

    let file = (evt.target as HTMLInputElement).files[0];

    if (!verifyCSV(file)) { return; }

    let reader = new FileReader();
    reader.onload = () => {
        /* READ AND VERIFY CSV UPLOAD */
        const fileData = readCSVData(reader);
        if (!fileData.valid) { return; }

        const sourceMappedData = fileData.source;
        const filterMappedData = fileData.filter;
        //const zeroPoints = fileData.zeroPoints;

        const itr = sourceMappedData.keys();
        let sourceData = itr.next().value;

        if (!sourceData) {
            alert('No source detected in file!');
            return;
        }

        let data = sourceMappedData.get(sourceData)
            .filter((val: number[]) => !isNaN(val[0]))
            .sort((a: number[], b: number[]) => a[0] - b[0]);
        
        /* DATA IS VERIFIED - NOW USE IT */
        myChart.setBoundaries(data);

        const tableData: any[] = [];
        for (let i = 0; i < data.length; i++) {
            pushTableData(tableData, data[i][0], data[i][1], data[i][2]);
        }

        // shift x axis for event time
        const shift = myChart.getMinMJD() - (myChart.getMaxMJD() - myChart.getMinMJD())*0.1;
        const eventTime = document.getElementById('time') as HTMLInputElement;
        eventTime.value = String(shift);
        myChart.setEventShift(shift);
        myChart.clearDatasets();

        const chartForm = document
            .getElementById('chart-info-form') as ChartInfoForm;

        // update chart data
        addChartData(myChart, filterMappedData, shift);
        updateDataField(filterMappedData, chartForm);

        myChart.setMinMJD(myChart.getMinMJD() - shift);
        myChart.setMaxMJD(myChart.getMaxMJD() - shift);

        resetOnUpload(myChart);
        addModel(filterMappedData, myChart);
        myChart.update();

        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}

// need to reset some form elements on upload
const resetOnUpload = (myChart: TransientChart) => {
    myChart.setScaleType('logarithmic');

    const parameterForm = document
        .getElementById('transient-form') as VariableLightCurveForm;

    const dropdown = document.getElementById('temporal') as HTMLSelectElement;
    dropdown.selectedIndex = 0;

    const tAvg = (myChart.getMinMJD() + myChart.getMaxMJD()) / 2.
    const mAvg = (myChart.getMinMag() + myChart.getMaxMag()) / 2.

    linkInputs(parameterForm["t"], parameterForm["t_num"], myChart.getMinMJD(), 
        myChart.getMaxMJD(), 0.01, tAvg, false);
    linkInputs(parameterForm["mag"], parameterForm["mag_num"], myChart.getMinMag(),
        myChart.getMaxMag(), 0.01, mAvg, false);
}

// 
function pushTableData(tableData: any[], jd: number, mag: number, filter: string) {
    if (isNaN(jd)) { return; }

    tableData.push({
        'jd': jd,
        'magnitude': isNaN(mag) ? null : mag,
        'filter': filter
    });
}


/*
    MISC.
*/
const addChartData = (myChart: TransientChart, datapoints: Map<string, Array<Array<number>>>, xShift:number) => {
    // colorMap maps filter name to color
    const dataITR = datapoints.keys();
    const errorITR = datapoints.keys();
    let tmp: Array<{x: number, y: number}> = [];
    let errors: Array<{x: number, y: number}> = [];

    /* These loops can be condensed. I split them up
    because the actual data needed to be the first 
    datasets to work with the undergrads label 
    function. I'll be overriding that with my own. */

    myChart.clearDatasets();
    for (let i = 0; i < datapoints.size; i++) {
        let key = dataITR.next().value;
        let dps = datapoints.get(key);
        let magShift = myChart.getMagShift(key) ? myChart.getMagShift(key): 0;
        let operation = magShift < 0 ? '\-' : '\+';

        tmp = [];
        for (let j = 0; j < dps.length; j++) {
            tmp.push({
                x: dps[j][0] - xShift,
                y: dps[j][1],
            });
        }
        if (key === 'gprime') {
            key = 'g\''
        }
        myChart.addDataset({
            label: key+operation+String(magShift),
            data: tmp,
            backgroundColor: FILTERCOLORS[key],
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            showLine: false,
            hidden: false,
            parsing: {},
        });
    }

    // add error bar datasets
    for (let i = 0; i < datapoints.size; i++) {
        let key = errorITR.next().value;
        let dps = datapoints.get(key);

        errors = [];
        for (let j = 0; j < dps.length; j++) {
            errors.push({x:null, y:null});
            errors.push({
                x: dps[j][0] - xShift,
                y: dps[j][1]-1,
            });
            errors.push({
                x: dps[j][0] - xShift,
                y: dps[j][1] + 1,
            });
        }
        if (key === 'gprime') {
            key = 'g\''
        }
        myChart.addDataset({
            label: "error-bar-" + String(key),
            data: errors,
            borderColor: "black",
            borderWidth: 1,
            pointRadius: 0,
            showLine:true,
            spanGaps: false,
            parsing: {}
        });
    }
}

//
const formatFilterName = (f: string) => {

    if (f === 'uprime') {
        f = "u\'";
    }
    else if (f === 'rprime') {
        f = "r\'";
    }
    else if (f === 'gprime') {
        f = "g\'";
    }
    else if (f === 'iprime') {
        f = "i\'";
    }
    else if (f === 'zprime') {
        f = "z\'";
    }
    return f;
}

// colors are picked by Dan
const FILTERCOLORS: { [key: string]: string } = {
    'U' : '#8601AF',
    'B' : '#0247FE',
    'V' : '#66B032',
    'R' : '#FE2712',
    'I' : '#4424D6',
    'Y' : '#347C98',
    'J' : '#66B032',
    'H' : '#FC600A',
    'K' : '#FE2712',
    "u\'": '#4424D6',
    "g\'": '#347C98',
    "r\'": '#FC600A',
    "i\'": '#8601AF',
    "z\'": '#0247FE',
    'uprime' : '#4424D6',
    'gprime' : '#347C98',
    'rprime' : '#FC600A',
    'iprime' : '#8601AF',
    'zprime' : '#0247FE'
}

const ZERO_POINT_VALUES: { [key: string]: number } = {
    'U' : 1.790,
    'B' : 4.063,
    'V' : 3.636,
    'R' : 3.064,
    'I' : 2.416,
    'J' : 1.589,
    'H' : 1.021,
    'K' : 0.640,
    "u\'": 3.680,
    "g\'": 3.643,
    "r\'": 3.648,
    "i\'": 3.644,
    "z\'": 3.631,
}