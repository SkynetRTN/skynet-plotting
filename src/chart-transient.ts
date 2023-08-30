'use strict';

import Handsontable from "handsontable";
import { linkInputs, updateTableHeight } from "./util"
import { CSVReader } from "./utilities/io/csv";
import { findNewElements } from "./utilities/string";

import { NonLinearRegression } from "./transient/model";
import { Photometry } from "./transient/photometry";
import { TransientTable } from "./transient/table";
import { TransientChart } from "./transient/chart";
import { HTML } from "./transient/html";

declare global {
    interface Window {
        photometry: Photometry;
    }
}


// TODO: ADD FILTER BY BUTTONS
// TODO: Model doesn't account for eb-v
// TODO: Want the model to be plotted across the entire dataset regardless of zoom

/**
 * The Transient Plotting Tool is useful for viewing photometry data
 * and fitting magnitude curves for transient events such as GRBs and 
 * kilonovae. 
 */
export function transient(): [Handsontable, TransientChart] {
    window.photometry = new Photometry();

    // initalize webpage components
    let components = initialize()
    const myTable = components.table;
    const myChart = components.chart;

    // define all forms and inputs that the user can modify
    const chartInfoForm = document.getElementById('chart-info-form') as ChartInfoForm;
    const modelForm = document.getElementById('transient-form') as VariableLightCurveForm;
    const eventTimeInput = document.getElementById('time') as HTMLInputElement;
    const temporalDropdown = document.getElementById('temporal') as HTMLSelectElement;
    const spectralDropdown = document.getElementById('spectral') as HTMLSelectElement;

    // ===================================================================
    // ========================== Chart Labels ===========================
    // ===================================================================
    chartInfoForm.elements['data'].oninput = () => {
        updateMagnitudes(myChart, chartInfoForm);
    }
    chartInfoForm.elements['title'].oninput = () => {
        myChart.updateTitle(chartInfoForm);
    }
    chartInfoForm.elements['xAxis'].oninput = () => {
        myChart.updateAxisLabel(chartInfoForm);
    }
    chartInfoForm.elements['yAxis'].oninput = () => {
        myChart.updateAxisLabel(chartInfoForm);
    }

    // ===================================================================
    // ========================= Toggle Fitting ==========================
    // ===================================================================
    document.getElementById('best-fit-auto').onclick = () => {
        updateFittingMethodToAuto(myChart, modelForm);
    }
    document.getElementById('best-fit-manual').onclick = () => {
        updateFittingMethodToManual(modelForm);
    }
    
    // ===================================================================
    // =========================== Event Time ============================
    // ===================================================================
    eventTimeInput.oninput = () => { updateJulianDates(myChart, eventTimeInput); }

    // ===================================================================
    // ========================= Temporal Model ==========================
    // ===================================================================
    temporalDropdown.onchange = () => { updateTemporalModel(myChart, temporalDropdown); }

    // ===================================================================
    // ========================= Spectral Model ==========================
    // ===================================================================
    spectralDropdown.onchange = () => { updateSpectralModel(spectralDropdown); }

    // ===================================================================
    // ======================== Model Parameters =========================
    // ===================================================================
    modelForm.addEventListener('input', (event: Event) => {
        const target = event.target as HTMLInputElement;
        // temporal and spectral are handled separately above
        if (target.name !== 'temporal' && target.name !== 'spectral' && 
            target.name !== 'time' && target.name !== '') {
            modelForm.oninput = () => {
                myChart.updateModel(modelForm);
                myChart.update();
            }
        }
    })

    // ===================================================================
    // =========================== Data Table ============================
    // ===================================================================
    // myTable.addHook('afterChange', (changes, source) => updateAfterRowChange(myChart, myTable, changes, source));
    myTable.addHook('afterChange', (_, __) => update(myChart, myTable));
    myTable.addHook('afterRemoveRow', (index, amount) => updateAfterRemoveRow(myChart, myTable, index, amount));
    myTable.addHook('afterCreateRow', (index, _, source) => updateAfterCreateRow(myChart, myTable, index, source));
    // myTable.addHook('afterPaste', (data, coords) => updateAfterPaste(myChart, myTable, data, coords));
    // myTable.addHook('afterUndo', (action) => updateAfterUndo(myChart, myTable, action));

    // ===================================================================
    // ============================== Chart ==============================
    // ===================================================================
    updateChartView(myChart);
    myChart.update();

    return [myTable, myChart];
}

/**
 * Creates the initial HTML, Table, and Chart
 * 
 * @returns HandsonTable and ChartJS object
 */
const initialize = () => {
    // HTML component
    new HTML();
    const modelForm = document.getElementById('transient-form') as VariableLightCurveForm;
    const chartForm = document.getElementById('chart-info-form') as ChartInfoForm;

    const eventTimeInput = document.getElementById('time') as HTMLInputElement;
    const eventTime = parseFloat(eventTimeInput.value);

    // Table component
    const transientTable = new TransientTable(window.photometry.clone());
    const table = transientTable.table;

    // Chart component
    let chart = new TransientChart();
    chart.addScatterData(window.photometry);
    chart.setBoundaries(window.photometry.julianDates, window.photometry.magnitudes);
    HTML.createModelSliders(chart);
    chart.addModel(window.photometry, modelForm, eventTime);
    chart.updateLegend(chartForm);
    chart.setReverseScale(true);

    return {table, chart};
}

/**
 * Adds a new row to the photomtry data. Rows created from pasting or undoing are handled spearately.
 * The only way for the the logic to be executed is if a user manualy adds a row which can only be
 * done one at a time. Thus, the amount added is always 1. If the row contains invalid data, then it
 * will not be displayed in the chart.
 * 
 * @param chart - TransientChart object
 * @param table - Handsontable object
 * @param index - location of new row
 * @param source - string that identifies source of hook cal
 */
const updateAfterCreateRow = (chart: TransientChart, table: Handsontable, index: number, source: any) => {
    if (source !== 'CopyPaste.paste') {
        window.photometry.insertRows(index, [{julianDate: null, magnitude: null, filter: null, uncertainty: null}]);
        chart.updateAfterTableChange(window.photometry);
        updateTableHeight(table);
    }
}

/**
 * Removes rows from the photometry data and chart. 
 * 
 * @param chart - TransientChart object
 * @param table - Handsontable object
 * @param index - location of new row
 * @param amount - number of rows removed
 */
const updateAfterRemoveRow = (chart: TransientChart, table: Handsontable, index: number, amount: number) => {
    if (window.photometry.getUniqueFilters().length <= 1) HTML.disable('spectral');
    else HTML.enable('spectral');

    window.photometry.removeRows(index, amount);
    chart.updateAfterTableChange(window.photometry);
    updateTableHeight(table);
}

/**
 * 
 * @param chart 
 * @param table 
 */
const update = (chart: TransientChart, table: Handsontable) => {
    let julianDates: number[] = [], magnitudes: number[] = []; 
    let uncertainties: number[] = [], filters: string[] = [];

    const data = table.getData();
    for (let i = 0; i < data.length; i++) {
        julianDates.push(Number(data[i][0]));
        magnitudes.push(Number(data[i][1]));
        filters.push(data[i][2]);
        uncertainties.push(Number(data[i][3]));
    }
    const rows = window.photometry.createRowsFromLists(julianDates, magnitudes,
                                                       uncertainties, filters);

    // cleanup start
    const tableFilters = [...new Set(filters)];
    const newFilters = findNewElements(tableFilters, window.photometry.getUniqueFilters());
    
    window.photometry.update(rows);

    for (const filter of newFilters) {
        window.photometry.setMagnitudeOffset(filter, 0);
    }
    // cleanup start

    chart.updateAfterTableChange(window.photometry);
    updateTableHeight(table);

}

/**
 * Parses the user input from the 'data' entry field and shifts the 
 * corresponding magnitudes in the Photometry data and Chart. Ignores
 * user input that is not of the form 'filterName operator number'.
 * 
 * @param form - ChartInfoForm object
 */
const updateMagnitudes = (chart: TransientChart, form: ChartInfoForm) => {
    const dataEntry = form.elements['data'].value;
    const dataArray = dataEntry.split(',').map((s) => s.trim());

    // parse the data entry field
    dataArray.forEach((data) => {
        const [key, valueStr] = data.split(/[+-]/).map((s) => s.trim());
        const value = parseFloat(valueStr) * (data.includes('+') ? 1 : -1);

        // update photometry data and chart with offset
        if (!isNaN(value) && value !== window.photometry.getMagnitudeOffset(key)) {
            const rValue = value - window.photometry.getMagnitudeOffset(key);
            chart.shiftMagnitudes(key, window.photometry.offsetMagnitude(key, rValue), value);
            chart.update();
        }
    });
}

/**
 * Shifts the julian dates (x-axis of the chart) by the value set in the event time field
 * 
 * @param chart - ChartJS object
 */
const updateJulianDates = (chart: TransientChart, eventTimeInput: HTMLInputElement) => {
    const eventTime = parseFloat(eventTimeInput.value);
    if (isNaN(eventTime) || eventTime < 0) return;

    // update photometry data and chart with offset
    const relativeOffset = eventTime - window.photometry.julianDateOffset;
    chart.shiftJulianDates(window.photometry.offsetJulianDates(relativeOffset));
}

/**
 * 
 * @param chart - ChartJS object
 * @param dropdown - updated temporal dropdown object
 */
const updateTemporalModel = (chart: TransientChart, dropdown: HTMLSelectElement) => {
    const opt = dropdown.options[dropdown.selectedIndex];
    const temporalModel = (<HTMLOptionElement>opt).value

    if (temporalModel === 'Power Law') HTML.enable('b', 'b_num');
    else HTML.disable('b', 'b_num');

    if (temporalModel === 'Power Law') chart.setScale('logarithmic');
    else if (temporalModel === 'Exponential') chart.setScale('linear');
    // TODO: model lines do not update when switching scales. investigate.
}

/**
 * 
 * @param dropdown updated spectral dropdown object
 */
const updateSpectralModel = (dropdown: HTMLSelectElement) => {
    const opt = dropdown.options[dropdown.selectedIndex];
    const spectralModel = (<HTMLOptionElement>opt).value
    const isAutoFitting = (document.getElementById("best-fit-manual") as HTMLButtonElement).disabled;

    if (spectralModel === 'Power Law') HTML.disable('ebv', 'ebv_num');
    else if (!isAutoFitting) HTML.enable('ebv', 'ebv_num');
}

/**
 * 
 * @param chart - ChartJS object
 */
const updateChartView = (chart: TransientChart) => {
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

/**
 * 
 * @param form - model form element
 */
const updateFittingMethodToManual = (form: VariableLightCurveForm) => {
    let params: Array<string> = ['a', 'b', 't', 'mag'];
    if (form['spectral'].value === 'Extinguished Power Law') params.push('ebv');

    for (let param of params) {
        HTML.enable(param, param + '_num');
    }
    document.getElementById("best-fit-manual").style.backgroundColor = 'lightblue';
    document.getElementById("best-fit-auto").style.backgroundColor = 'white';
}

/**
 * Fits the data using non-linear regression. The fitting routine is defined in Python
 * on the Skynet server and thus an asynchronous call is used.
 * 
 * @param chart - ChartJS object
 * @param form - model form element
 */
const updateFittingMethodToAuto = (chart: TransientChart, form: VariableLightCurveForm) => {
    let params: Array<string> = ['a', 'b', 't', 'mag'];
    if (form['spectral'].value === 'Extinguished Power Law') params.push('ebv');

    for (let param of params) {
        HTML.disable(param, param + '_num');
    }

    const regression = new NonLinearRegression(form);
    regression.minRange = chart.getVisibleRange()[0];
    regression.maxRange = chart.getVisibleRange()[1];
    regression.defineData(window.photometry);

    // asynchrounously call the fitting routine
    let status = regression.fit();
    status.then(result => {
        if (result === 'success') chart.updateModel(form);
    });
    document.getElementById("best-fit-manual").style.backgroundColor = 'white';
    document.getElementById("best-fit-auto").style.backgroundColor = 'lightblue';
}

/**
 * Parses uploaded file and updates the table and chart.
 * 
 * @param evt - event handler for file upload
 * @param table - HandsOnTable object
 * @param myChart - ChartJS object
 */
export function transientFileUpload(evt: Event, table: Handsontable, chart: TransientChart) {

    let file = (evt.target as HTMLInputElement).files[0];

    let reader = new FileReader();
    reader.onload = () => {

        let csvReader = new CSVReader(file, reader.result as string)
        let uploadedData: any = csvReader.parse();

        let rows = window.photometry.
                    createRowsFromLists(uploadedData['mjd'].map((val: string) => parseFloat(val)),
                                        uploadedData['mag'].map((val: string) => parseFloat(val)),
                                        uploadedData['mag_error'].map((val: string) => parseFloat(val)),
                                        uploadedData['filter']);
        window.photometry.update(rows); // update data object with uploaded data

        chart.updateAfterTableChange(window.photometry);
        resetOnUpload(chart);

        table.updateSettings({data: window.photometry.clone()});
    }
    reader.readAsText(file);
}

/**
 * Resets form and chart data after uploading a dataset.
 * 
 * @param chart - ChartJS Object
 */
const resetOnUpload = (chart: TransientChart) => {
    chart.setScale('logarithmic');

    // reset model dropdowns
    (document.getElementById('temporal') as HTMLSelectElement).selectedIndex = 0;
    (document.getElementById('spectral') as HTMLSelectElement).selectedIndex = 0;

    // reset sliders and their linked inputs
    const modelForm = document.getElementById('transient-form') as VariableLightCurveForm;
    const mAvg = (chart.minMag + chart.maxMag) / 2.

    linkInputs(modelForm["t"], modelForm["t_num"], 0, chart.getMaxMJD(), 0.01, chart.getMinMJD(), false);
    linkInputs(modelForm["mag"], modelForm["mag_num"], 0., 30., 0.01, mAvg, false);

    updateFittingMethodToManual(modelForm);
}
