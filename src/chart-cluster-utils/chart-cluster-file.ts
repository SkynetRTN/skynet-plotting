/**
 * This file contains functions that upload/download/manipulate files in cluster interfaces
 */


import { Chart } from "chart.js";
import Handsontable from "handsontable";
import {baseUrl, httpPostAsync, modelFormKey } from "./chart-cluster-util";
import {changeOptions, getDateString, updateLabels, updateTableHeight } from "../util";
import { updateHRModel } from "./chart-cluster-model";
import { graphScale, updateClusterProScatter, updateScatter } from "./chart-cluster-scatter";
import {starData, sortStar} from "./chart-cluster-gaia";
import {clusterProCheckControl, rangeCheckControl } from "./chart-cluster-interface";
import { updateProForm, proFormMinmax, updateChart2, chart2Scale } from "../chart-cluster3";

/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myCharts The chart to be plotted
 * @param {graphScale} graphMaxMin the graphScale object that includes chart bounding information
 */
export function clusterFileUpload(
    evt: Event,
    table: Handsontable,
    myCharts: Chart[],
    graphMaxMin: graphScale,
    isCluster3: boolean =false,
    proForm: ClusterProForm = null,
) {
    // console.log("clusterFileUpload called");
    const file = (evt.target as HTMLInputElement).files[0];

    if (file === undefined) {
        return;
    }

    // File type validation
    if (
        !file.type.match("(text/csv|application/vnd.ms-excel)") &&
        !file.name.match(".*.csv")
    ) {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a CSV file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const clusterForm = document.getElementById("cluster-form") as ClusterForm;
        const modelForm = document.getElementById("model-form") as ModelForm;
        clusterForm["d"].value = Math.log(3).toString();
        clusterForm["err"].value = "1";
        clusterForm["err_num"].value = "1";
        modelForm["age"].value = "6.6";
        clusterForm["red"].value = "0";
        modelForm["metal"].value = "-3.4";
        clusterForm["distrange"].value = "100";
        //clusterForm["err_num"].value = "1";
        clusterForm["d_num"].value = "3";
        modelForm["age_num"].value = "6.6";
        clusterForm["red_num"].value = "0";
        modelForm["metal_num"].value = "-3.4";
        clusterForm["distrange_num"].value = "100";
        rangeCheckControl()
        let proMinMax: number[] = null;
        if (isCluster3)
            clusterProCheckControl()

        const data: string[] = (reader.result as string)
            .split("\n")
            .filter((str) => str !== null && str !== undefined && str !== "");

        //let stars: starData[] =[];

        // find value index in database
        let keys = (data.splice(0, 1) as string[])[0].split(',');
        let wantedKeys: string[] = ['id', 'filter', 'calibrated_mag\\r', 'mag', 'mag_error', 'ra_hours', 'dec_degs']
        let keyIndex: {[key: string]: number}  = {'id': NaN, 'filter': NaN, 'calibrated_mag\\r': 23, 'mag': NaN, 'mag_error': NaN, 'ra_hours': NaN, 'dec_degs': NaN}

        for (let i = 0; i < wantedKeys.length; i++) {
            let key: string = wantedKeys[i]
            let index: number = keys.findIndex(x => x === key)
            if (isNaN(keyIndex[key]))
                keyIndex[key] = index
        }
        //store these in the table

        //request server to get the data
        let stars: starData[] = []
        for (let row of data) {
            let items = row.trim().split(",");
            let src = items[keyIndex['id']]
            let filter = items[keyIndex['filter']];
            let calibratedMag = parseFloat(items[keyIndex['calibrated_mag\\r']]);
            let ra = parseFloat(items[keyIndex['ra_hours']])*15;
            let dec = parseFloat(items[keyIndex['dec_degs']]);
            let mag = items[keyIndex['mag']];
            let err = parseFloat(items[keyIndex['mag_error']]);
            stars.push(new starData(src, filter, err, calibratedMag, mag, ra, dec, null, [null, null]))
        }
        let cleanedup = sortStar(stars)
        let url: string = baseUrl + "/gaia"
        let sortedData = cleanedup[0]
        httpPostAsync(url, cleanedup[1],
            (result: string)=>{
                let gaia = JSON.parse(result)
                if (!result.includes('error')) {
                    let [dict, filters] = generateDatadictGaia(sortedData, gaia)
                    updateCharts(myCharts, table, dict, modelForm, clusterForm, filters, graphMaxMin, isCluster3, proForm, proMinMax)
                } else {
                    let [dict, filters] = generateDatadict(sortedData)
                    updateCharts(myCharts, table, dict, modelForm, clusterForm, filters, graphMaxMin, false, proForm, proMinMax)
                }
            },
            ()=>{
                let [dict, filters] = generateDatadict(sortedData)
                updateCharts(myCharts, table, dict, modelForm, clusterForm, filters, graphMaxMin, false, proForm, proMinMax)
            }
        )
    };
    reader.readAsText(file);
}


/**
 * This function downloads filtered data from Handsontable
 * DATA FLOW: table -> file
 * @param {Handsontable} table The table which data is in
 */
export function clusterFileDownload(
    table: Handsontable,
    myCharts: Chart[],
    clusterForm: ClusterForm,
    modelForm: ModelForm,
    dataSetIndex: number[],
    graphMaxMin: graphScale,
    specificChart: number = -1,
    clusterProForm: ClusterProForm = null,

){
    let csvRowsStar = [];
    let starData = updateScatter(table, myCharts, clusterForm, modelForm, dataSetIndex, graphMaxMin, specificChart, clusterProForm);
    if (starData.length === 0){
        alert("Please upload a data file before downloading");
        return
    }
    // let data = [{'V mag': 69},{'V mag': 18}]
    csvRowsStar.push(Object.keys(starData[0]).join(','));

    for (let i = 0; i < starData.length; i++) {
        // @ts-ignore
        let vals = Object.values(starData[i]);
        csvRowsStar.push(vals);
    }


    let csvRowsHR = ['x,y,chart,segment'];
    for (let c = 0; c < myCharts.length; c++) {
        let chart = myCharts[c];
        let dataSets = Object.assign([chart.data.datasets[1].data, chart.data.datasets[0].data])
        for (let set = 0; set < dataSets.length; set++) {
            let dataSet = dataSets[set];
            if (dataSet.length !== 0) {
                for (let i = 0; i <dataSet.length; i++) {
                    dataSet[i]['chart'] = (c + 1).toString()
                    dataSet[i]['segment'] = (set + 1).toString()
                    // @ts-ignore
                    csvRowsHR.push(Object.values(dataSet[i]))
                }
            }
        }
    }
    let dateTime = getDateString()
    csvDownload(csvRowsStar.join('\n'), 'Cluster Pro Scatter Download '+ dateTime + '.csv')
    csvDownload(csvRowsHR.join('\n'), 'Cluster Pro Model Download '+ dateTime + '.csv')
}

function updateCharts(
    myCharts: Chart[],
    table: Handsontable,
    datadict: Map<string, Map<string, number>>,
    modelForm: ModelForm,
    clusterForm: ClusterForm,
    filters: string[],
    graphMaxMin: graphScale,
    isCluster3: boolean,
    proForm: ClusterProForm,
    proMinMax: number[],
    ) {
    let blue = modelForm[modelFormKey(0, 'blue')];
    let red = modelForm[modelFormKey(0, 'red')];
    let lum = modelForm[modelFormKey(0, 'lum')];

    //order filters by temperature
    // const knownFilters = ["U", "uprime", "B", "gprime", "V", "rprime", "R", "iprime", "I", "zprime", "Y", "J", "H", "Ks", "K",];
    const knownFilters = ["U", "u\'", "B", "g\'", "V", "r\'", "R", "i\'", "I", "z\'", "Y", "J", "H", "Ks", "K",];
    //knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters, leaving the filters in the file in order.
    filters = knownFilters.filter((f) => filters.indexOf(f) >= 0);
    //if it ain't known ignore it
    const optionList = [];
    const headers: any[] = [];
    const columns: any[] = [];
    let hiddenColumns: any[] = [];
    let queryCharts =  myCharts.length > 2? myCharts.slice(0,2) : myCharts
    let chartLength = queryCharts.length
    for (let i = 0; i < filters.length; i++) {
        //makes a list of options for each filter
        let filter_i = filters[i] //.replace('prime', '\'');
        optionList.push({
            value: filter_i,
            title: filter_i + " Mag",
            text: filter_i,
        });
        for (let j = 0; j < 7; j++) {
            //we have to multiply up the length for the error and gaia data
            hiddenColumns[i + j * filters.length] = i + j * filters.length;
        }
        headers.push(filter_i + " Mag"); //every other column is err
        headers.push(filter_i + " err");
        headers.push(filter_i + " ra");
        headers.push(filter_i + " dec");
        headers.push(filter_i + " dist");
        headers.push(filter_i + " pmra");
        headers.push(filter_i + " pmdec");
        columns.push({
            data: filter_i,
            type: "numeric",
            numericFormat: {pattern: {mantissa: 2}},
        });
        columns.push({
            data: filter_i + "err",
            type: "numeric",
            numericFormat: {pattern: {mantissa: 2}},
        });
        columns.push({
            data: filter_i + "ra",
            type: "numeric",
            numericFormat: {pattern: {mantissa: 5}},
        });
        columns.push({
            data: filter_i + "dec",
            type: "numeric",
            numericFormat: {pattern: {mantissa: 5}},
        });
        columns.push({
            data: filter_i + "dist",
            type: "numeric",
            numericFormat: {pattern: {mantissa: 2}},
        });
        columns.push({
            data: filter_i + "pmra",
            type: "numeric",
            numericFormat: {pattern: {mantissa: 5}},
        });
        columns.push({
            data: filter_i + "pmdec",
            type: "numeric",
            numericFormat: {pattern: {mantissa: 5}},
        });
    }
    headers.push("id")
    columns.push({
        data: "id",
        type: "text",
        readOnly: true,
    })
    headers.push("isValid")
    columns.push({
        data: "isValid",
        type: "text",
    })
    // filters = newFilter;
    hiddenColumns = hiddenColumns.filter((c) => [0, 7].indexOf(c) < 0); //get rid of the columns we want revealed
    hiddenColumns.push(columns.length-1)
    hiddenColumns.push(columns.length-2)
    //convrt datadict from dictionary to nested number array tableData
    const tableData: { [key: string]: number }[] = [];
    let itr = datadict.keys()
    datadict.forEach((src) => {
        const row: { [key: string]: number } = {};
        row['id'] = itr.next().value;
        row['isValid'] = "True" as any;
        for (let filterIndex in filters) {
            row[filters[filterIndex]] = src.get(filters[filterIndex]);
            row[filters[filterIndex] + "err"] = src.get(filters[filterIndex] + "err");
            row[filters[filterIndex] + "ra"] = src.get(filters[filterIndex] + "ra");
            row[filters[filterIndex] + "dec"] = src.get(filters[filterIndex] + "dec");
            row[filters[filterIndex] + "dist"] = src.get(filters[filterIndex] + "dist");
            row[filters[filterIndex] + "pmra"] = src.get(filters[filterIndex] + "pmra");
            row[filters[filterIndex] + "pmdec"] = src.get(filters[filterIndex] + "pmdec");
        }

        tableData.push(row);
    });
    for (let c = 0; c < chartLength; c++) {
        let myChart = myCharts[c] as Chart<'line'>;
        myChart.options.plugins.title.text = "Title";
        myChart.data.datasets[2].label = "Data";
        myChart.options.scales['x'].title.text = ('x' + (c+1).toString());
        myChart.options.scales['y'].title.text = ('y' + (c+1).toString());
        updateLabels(myChart, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, c);

        //Change filter options to match file
        blue = modelForm[modelFormKey(c, 'blue')];
        red = modelForm[modelFormKey(c, 'red')];
        lum = modelForm[modelFormKey(c, 'lum')];

        //Change the options in the drop downs to the file's filters
        //blue and lum are most blue by default, red is set to most red
        changeOptions(blue, optionList);
        changeOptions(red, optionList);
        //red.value = red.options[red.options.length-1].value;
        changeOptions(lum, optionList);

        blue.value = filters[0];
        red.value = filters[1];
        lum.value = filters[1];
    }
    updateHRModel(modelForm, table, queryCharts,
        (c: number) => {
            if (c === chartLength-1){
                table.updateSettings({
                    data: tableData,
                    colHeaders: headers,
                    columns: columns,
                    hiddenColumns: {
                        columns: hiddenColumns,
                        // exclude hidden columns from copying and pasting
                        //@ts-ignore
                        copyPasteEnabled: false,
                    },
                }); //hide all but the first 3 columns
                updateTableHeight(table);
                for (let i = 0; i < chartLength; i++) {
                    graphMaxMin.updateMode('auto', i);
                    updateScatter(table, [myCharts[i]], clusterForm, modelForm, [2], graphMaxMin);
                    myCharts[i].update()
                }
                if (isCluster3){
                    proMinMax = proFormMinmax(table, modelForm)
                    updateProForm(proMinMax, proForm)
                    let chart = myCharts[myCharts.length-1];
                    updateClusterProScatter(table, chart, modelForm, clusterForm);
                    updateChart2(chart, proForm, proMinMax)
                    chart2Scale(chart, proMinMax);
                    chart.update();
                }
                document.getElementById("standardView").click();
            }
        }, true);
}



function generateDatadictGaia(sortedData: starData[], gaia: any): [Map<string, Map<string, number>>, string[]]{
    let gaia_i = 0;
    let data_i = 0;
    let filters: string[] = [];
    let datadict = new Map<string, Map<string, number>>(); // initializes a dictionary for the data
    while (true) {
        try {
            while (true) {
                if (sortedData[data_i]['id'] < gaia[gaia_i]['id']) {
                    data_i++;
                } else {
                    break;
                }
            }
            // @ts-ignore
            if (sortedData[data_i]['id'] === gaia[gaia_i]['id']) {
                sortedData[data_i]['distance'] = gaia[gaia_i]['range']
                sortedData[data_i]['motion'][0] = gaia[gaia_i]['pm']['ra']
                sortedData[data_i]['motion'][1] = gaia[gaia_i]['pm']['dec']
                let star = sortedData[data_i]
                let src = star['id']
                let filter = star['filter'].replace('prime', '\'')
                if (!datadict.has(src)) {
                    datadict.set(src, new Map<string, number>());
                }
                if (star['mag'] !== "") {
                    datadict.get(src).set(filter, isNaN(star['filteredMag']) ? null : star['filteredMag']);
                    datadict.get(src).set(filter + "err", isNaN(star['err']) ? 0 : star['err']);
                    datadict.get(src).set(filter + "ra", isNaN(star['ra']) ? null : star['ra']);
                    datadict.get(src).set(filter + "dec", isNaN(star['dec']) ? null : star['dec']);
                    datadict.get(src).set(filter + "dist", null === (star['distance']) ? null : star['distance'])
                    datadict.get(src).set(filter + "pmra", null === (star['motion'][0]) ? null : star['motion'][0])
                    datadict.get(src).set(filter + "pmdec", null === (star['motion'][1]) ? null : star['motion'][1])
                    if (!filters.includes(filter)) {
                        filters.push(filter);
                    }
                }
                data_i++;
            } else {
                gaia_i++;
            }
        } catch(err) {
            break
        }
    }

    //add null values for sources that didn't show up under each filter
    for (const src of datadict.keys()) {
        for (const f of filters) {
            if (!datadict.get(src).has(f)) {
                datadict.get(src).set(f, null);
                datadict.get(src).set(f + "err", null);
                datadict.get(src).set(f + "ra", null);
                datadict.get(src).set(f + "dec", null);
                datadict.get(src).set(f + "dist", null)
                datadict.get(src).set(f + "pmra", null)
                datadict.get(src).set(f + "pmdec", null)
            }
        }
    }
    return [datadict, filters]
}

function generateDatadict(sortedData: starData[]): [Map<string, Map<string, number>>, string[]]{
    let filters: string[] = [];
    let datadict = new Map<string, Map<string, number>>(); // initializes a dictionary for the data
    for (let i = 0; i < sortedData.length; i ++) {
        let star = sortedData[i]
        let src = star['id']
        let filter = star['filter'].replace('prime', '\'')
        if (!datadict.has(src)) {
            datadict.set(src, new Map<string, number>());
        }
        if (star['mag'] !== "") {
            datadict.get(src).set(filter, isNaN(star['filteredMag']) ? null : star['filteredMag']);
            datadict.get(src).set(filter + "err", isNaN(star['err']) ? 0 : star['err']);
            datadict.get(src).set(filter + "ra", isNaN(star['ra']) ? null : star['ra']);
            datadict.get(src).set(filter + "dec", isNaN(star['dec']) ? null : star['dec']);
            datadict.get(src).set(filter + "dist", null)
            datadict.get(src).set(filter + "pmra", null)
            datadict.get(src).set(filter + "pmdec", null)
            if (!filters.includes(filter)) {
                filters.push(filter);
            }
        }
    }

    //add null values for sources that didn't show up under each filter
    for (const src of datadict.keys()) {
        for (const f of filters) {
            if (!datadict.get(src).has(f)) {
                datadict.get(src).set(f, null);
                datadict.get(src).set(f + "err", null);
                datadict.get(src).set(f + "ra", null);
                datadict.get(src).set(f + "dec", null);
                datadict.get(src).set(f + "dist", null)
                datadict.get(src).set(f + "pmra", null)
                datadict.get(src).set(f + "pmdec", null)
            }
        }
    }
    return [datadict, filters]
}

function csvDownload(dataString: string, fileName: string){
    // Creating a Blob for having a csv file format
    // and passing the data with type
    const blob = new Blob([dataString], { type: 'text/csv' });

    // Creating an object for downloading url
    const url = window.URL.createObjectURL(blob);

    // Creating an anchor(a) tag of HTML
    const a = document.createElement('a');

    // Passing the blob downloading url
    a.setAttribute('href', url);

    // Setting the anchor tag attribute for downloading
    // and passing the download file name
    a.setAttribute('download', fileName);

    a.click();

    a.remove();
}