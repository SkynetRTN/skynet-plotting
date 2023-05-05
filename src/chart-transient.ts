'use strict';

//import Chart from "chart.js/auto";
import Handsontable from "handsontable";

import {disableDropdown, initHTML} from "./chart-transient-utils/chart-transient-html";
import {TransientChart} from "./chart-transient-utils/chart-transient-chart";
import {NonLinearRegression} from "./chart-transient-utils/chart-transient-model";
import {readCSVData, verifyCSV} from "./chart-transient-utils/chart-transient-file";
import {tableCommonOptions} from "./config"
import {linkInputs, sanitizeTableData, updateTableHeight} from "./util"
import {LinearScaleOptions} from "chart.js";
import {FILTERCOLORS, findDelimiter, formatFilterName} from "./chart-transient-utils/chart-transient-util";


// enables certain print statements when true
const DEBUG = false;

/*
    HANDLE USER INPUT
*/
const shiftMagnitudes = (myChart: TransientChart, form: ChartInfoForm) => {
    if (DEBUG) {
        console.log(':: SHIFT MAGNITUDES START ::');
    }

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

        if (isNaN(shiftVal)) {
            continue;
        }
        if (shiftVal > 100 || shiftVal < -100) {
            alert('Magnitudes can only be shifted +/- 100');
            continue;
        }

        // map of valid updated values
        if (!shiftedFilters.has(updatedFilter)) {
            shiftedFilters.set(updatedFilter, sign * shiftVal);
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
                if (change != 0) {
                    let shiftedData = [];
                    for (let j = 0; j < myChart.getDataset(i).data.length; j++) {
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
    if (DEBUG) {
        console.log(':: SHIFT MAGNITUDES END ::');
    }
    //
}

// internal
const updateLabels = (myChart: TransientChart, form: ChartInfoForm) => {
    if (DEBUG) {
        console.log(':: UPDATE LABELS START ::');
    }
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

    if (DEBUG) {
        console.log(':: UPDATE LABELS END ::');
    }
}


const handleDropdownInput = (chart: TransientChart) => {
    const dropdown = document.getElementById('temporal') as HTMLSelectElement;
    dropdown.onchange = () => {
        const sel = dropdown.selectedIndex;
        const opt = dropdown.options[sel];
        const temporalModel = (<HTMLOptionElement>opt).value

        chart.setScaleType(temporalModel);
        console.log(temporalModel);
        if (temporalModel === 'Power Law') {
            disableDropdown('filter', false, false);
            toggleFields(['b'], false);
        } else {
            disableDropdown('filter', true, false);
            toggleFields(['b'], true);
        }
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

    panLeft.onmousedown = function () {
        pan = setInterval(() => {
            chart.chart.pan(5)
        }, 20)
    }
    panLeft.onmouseup = panLeft.onmouseleave = function () {
        clearInterval(pan);
    }
    panRight.onmousedown = function () {
        pan = setInterval(() => {
            chart.chart.pan(-5)
        }, 20)
    }
    panRight.onmouseup = panRight.onmouseleave = function () {
        clearInterval(pan);
    }

    Reset.onclick = function () {
        chart.resetView();
        chart.update();
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

// 
function handleTableUpdate(table: Handsontable, myChart: TransientChart) {
    if (DEBUG) {
        console.log('Handling update to table..');
    }

    // can't pass filter col ([2]) to sanitize since is string
    const tableData = sanitizeTableData(table.getData(), [0, 1]);
    const form = document
        .getElementById('chart-info-form') as ChartInfoForm;

    setChartBoundaries(myChart, table);

    // TODO: Check if ths makes sense + put into function
    let timeShift = myChart.getMinMJD() - ((myChart.getMaxMJD() - myChart.getMinMJD()) * 0.1);
    if (timeShift < 0) {
        timeShift = 0;
    }

    myChart.timeShift = timeShift;
    if (isNaN(myChart.eventShift)) {
        myChart.eventShift = 0;
    }

    // ignore unsupported filters
    const supportedFilters = [] as string[];
    Object.keys(FILTERCOLORS).forEach(key => {
        supportedFilters.push(key);
    });

    // get data from table
    const filterMappedData = new Map();
    let numOfFilters: number = 0;
    for (let i = 0; i < tableData.length; i++) {
        let julianDate = tableData[i][0] - timeShift;
        let magnitude = tableData[i][1];
        let filter = tableData[i][2];

        // if (supportedFilters.indexOf(filter) > 1) {
        filter = formatFilterName(filter);
        if (!filterMappedData.has(filter)) {
            filterMappedData.set(filter, []);
            numOfFilters += 1;
        }
        if (myChart.getMagShift(filter)) {
            magnitude += myChart.getMagShift(filter);
        }
        filterMappedData.get(filter).push([julianDate, magnitude]);
        // }
    }

    if (numOfFilters <= 1) {
        disableDropdown('spectral', true, false);
    } else {
        disableDropdown('spectral', false, false);
    }

    // update min/max give nthe shift value
    myChart.setMinMJD(myChart.getMinMJD() - timeShift);
    myChart.setMaxMJD(myChart.getMaxMJD() - timeShift);
    myChart.addData(filterMappedData, 0);

    const modelForm = document
        .getElementById('transient-form') as VariableLightCurveForm;
    myChart.addModel(filterMappedData, modelForm);
    updateLabels(myChart, form);

    myChart.setReverseScale(true);
    myChart.update();
}


/*
    INITIALIZE WEBPAGE COMPONENTS
*/
const initialize = () => {
    initHTML();
    const data = initData();
    const table = initTable(data.table);
    const chart = initChart(data.chart);
    initModel(chart, table);

    const modelForm = document
        .getElementById('transient-form') as VariableLightCurveForm;
    chart.addModel(data.chart, modelForm);

    return {table, chart};
}

const initData = () => {
    const NUMOFPOINTS = 14;
    const dummyData = generateDummyData(NUMOFPOINTS);
    const mappedDummyData = mapDummyData(dummyData);

    return {table: dummyData, chart: mappedDummyData};
}

// Handsontable
const initTable = (data: { jd: number, magnitude: number, filter: string }[]) => {
    const container = document.getElementById('table-div');
    return new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: data,
        colHeaders: ['Julian Date', 'Magnitude', 'Filter'],
        maxCols: 3,
        columns: [
            {data: 'jd', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'magnitude', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'filter', type: 'text'},
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
    chart.addData(mappedData, 0);

    return chart;
}

// chi-by-eye model
const initModel = (chart: TransientChart, table: Handsontable) => {
    setChartBoundaries(chart, table);
    createModelSliders(chart);
}

// dummy data formatted for table
const generateDummyData = (numOfPoints: number) => {
    // const filters = ['B', 'V', 'R', 'I'];
    const filters = ['B', 'B', 'B', 'V',
        'V', 'V', 'V', 'R',
        'R', 'R', 'R', 'R',
        'I', 'I', 'I'];

    let xdata = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    let ydata = [9.5278, 10.0170, 10.3031, 10.4943,
        10.6518, 10.7805, 10.8893, 10.8958,
        10.9789, 11.0533, 11.1205, 11.1819,
        11.0864, 11.1387, 11.187];
    let data = [];
    for (let i = 0; i < filters.length; i++) {
        data.push({
            'jd': xdata[i],
            'magnitude': ydata[i],
            'filter': filters[i],
        });
    }
    for (let i = filters.length + 1; i < filters.length + 5; i++) {
        data.push({
            'jd': i,
            'magnitude': 10,
            'filter': 'B',
        });
    }
    // for (let i=0; i < numOfPoints; i++)  {
    //     let idx = Math.floor(Math.random() * filters.length);
    //     data.push({
    //         'jd': i * 10 + Math.random() * 10,
    //         'magnitude': Math.random() * 20,
    //         'filter': filters[idx],
    //     });        
    // }
    return data;
}

// dummy data formatted for chart
const mapDummyData = (data: { jd: number, magnitude: number, filter: string }[]) => {

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
const createModelSliders = (
    chart: TransientChart,
    m?: number,
    a?: number,
    b?: number,
    ebv?: number,
    t?: number,) => {

    const parameterForm = document
        .getElementById('transient-form') as VariableLightCurveForm;

    if (!a) {
        a = -1.0;
    }
    if (!b) {
        b = -0.5;
    }
    if (!ebv) {
        ebv = 0;
    }
    if (!t) {
        t = (chart.getMinMJD() + chart.getMaxMJD()) / 2.;
    }
    if (!m) {
        m = (chart.minMag + chart.maxMag) / 2.;
    }
    let step = 0.001;

    linkInputs(parameterForm["a"], parameterForm["a_num"], -3, 1, step, a,
        false, true, -100, 100);
    linkInputs(parameterForm["b"], parameterForm["b_num"], -2, 1, step, b,
        false, true, -100, 100);
    linkInputs(parameterForm["ebv"], parameterForm["ebv_num"], 0, 1, step, ebv,
        false, true, 0, 100);
    linkInputs(parameterForm["t"], parameterForm["t_num"], chart.getMinMJD(),
        chart.getMaxMJD(), step, t, false, true, -10000, -10000);
    linkInputs(parameterForm["mag"], parameterForm["mag_num"], chart.minMag,
        chart.maxMag, step, m, false, true, -1000, 1000);
}


// min/max mjd and magnitude
const setChartBoundaries = (chart: TransientChart, table: Handsontable) => {
    const tableData = sanitizeTableData(table.getData(), [0, 1]);
    chart.setMinMJD(Number.POSITIVE_INFINITY);
    chart.setMaxMJD(0);

    let minMJD = chart.getMinMJD();
    let maxMJD = chart.getMaxMJD();
    let minMag = chart.minMag;
    let maxMag = chart.maxMag;

    for (let i = 0; i < tableData.length; i++) {
        minMJD = Math.min(minMJD, tableData[i][0]);
        maxMJD = Math.max(maxMJD, tableData[i][0]);
        minMag = Math.min(minMag, tableData[i][1]);
        maxMag = Math.max(maxMag, tableData[i][1]);
    }
    chart.setMinMJD(minMJD);
    chart.setMaxMJD(maxMJD);
    chart.minMag = minMag;
    chart.maxMag = maxMag;
}

/* 
    BEST FIT
*/
const toggleFields = (params: Array<string>, bool: boolean) => {
    for (let param of params) {
        (document.getElementById(param) as HTMLInputElement).disabled = bool;
        (document.getElementById(param + '_num') as HTMLInputElement).disabled = bool;
    }
}

const toggleBestFitText = (text: string) => {
    document.getElementById('best-fit').textContent = text;
}

// switch between manual and algorithm fit
const toggleBestFitMethod = (chart: TransientChart, table: Handsontable, form: VariableLightCurveForm) => {
    let paramsToBeToggled: Array<string> = [];
    const spectralOption = form['spectral'].value;

    if (spectralOption === 'Power Law') {
        paramsToBeToggled = ['a', 'b', 't', 'mag'];
    } else if (spectralOption === 'Extinguished Power Law') {
        paramsToBeToggled = ['ebv', 'a', 'b', 't', 'mag'];
    }
    const text = document.getElementById('best-fit').textContent;

    if (text === 'Find Best Fit Parameters Algorithmically') {
        toggleFields(paramsToBeToggled, true);
        toggleBestFitText('Find Best Fit Parameters Manually');

        // format data here and only fit to supported filters!
        const tableData = sanitizeTableData(table.getData(), [0, 1]);
        const range = chart.getVisibleRange();
        const regression = new NonLinearRegression(form, tableData, chart.eventShift, range);
        let status = regression.leastSquaresMethod();
        status.then(result => { // async
            if (result === 'success') {
                chart.updateModel(form);
            }
        });
    } else if (text === 'Find Best Fit Parameters Manually') {
        toggleFields(paramsToBeToggled, false);
        toggleBestFitText('Find Best Fit Parameters Algorithmically');
    }
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
    const modelForm = document
        .getElementById('transient-form') as VariableLightCurveForm;

    // TODO: condense these
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

    // toggle fitting method
    document.getElementById('best-fit').onclick = () => {
        toggleBestFitMethod(myChart, myTable, modelForm);
    }

    // update chart
    modelForm.oninput = () => {
        handleDropdownInput(myChart);
        handleEventTimeInput(myChart);
        myChart.updateModel(modelForm);
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

    if (!verifyCSV(file)) {
        return;
    }

    let reader = new FileReader();
    reader.onload = () => {
        /* READ AND VERIFY CSV UPLOAD */
        const fileData = readCSVData(reader);
        if (!fileData.valid) {
            return;
        }

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
        const shift = myChart.getMinMJD() - (myChart.getMaxMJD() - myChart.getMinMJD()) * 0.1;
        const eventTime = document.getElementById('time') as HTMLInputElement;
        eventTime.value = String(shift);
        myChart.eventShift = shift;
        myChart.clearDatasets();

        const chartForm = document
            .getElementById('chart-info-form') as ChartInfoForm;

        // update chart data
        myChart.addData(filterMappedData, shift);
        updateDataField(filterMappedData, chartForm);

        myChart.setMinMJD(myChart.getMinMJD() - shift);
        myChart.setMaxMJD(myChart.getMaxMJD() - shift);

        resetOnUpload(myChart);
        const modelForm = document
            .getElementById('transient-form') as VariableLightCurveForm;
        myChart.addModel(filterMappedData, modelForm);
        myChart.update();

        table.updateSettings({data: tableData});
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
    const mAvg = (myChart.minMag + myChart.maxMag) / 2.

    linkInputs(parameterForm["t"], parameterForm["t_num"], myChart.getMinMJD(),
        myChart.getMaxMJD(), 0.01, tAvg, false);
    linkInputs(parameterForm["mag"], parameterForm["mag_num"], myChart.minMag,
        myChart.maxMag, 0.01, mAvg, false);

    toggleFields(['a', 'b', 't', 'mag'], false);
    toggleFields(['ebv'], true);
    toggleBestFitText('Find Best Fit Parameters Algorithmically');
}

function pushTableData(tableData: any[], jd: number, mag: number, filter: string) {
    if (isNaN(jd)) {
        return;
    }

    tableData.push({
        'jd': jd,
        'magnitude': isNaN(mag) ? null : mag,
        'filter': filter
    });
}
