/**
 * This file contains functions that upload/download/manipulate files in cluster interfaces
 */


import { Chart } from "chart.js";
import Handsontable from "handsontable";
import { modelFormKey } from "./chart-cluster-util";
import {changeOptions, updateLabels, updateTableHeight } from "../util";
import { updateHRModel } from "./chart-cluster-model";
import { graphScale, updateScatter } from "./chart-cluster-scatter";
import { sortStarDuplicates, starData, sortStarid, maxMinRaDec, gaiaData } from "./chart-gaia-util";


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
        //clusterForm["err"].value = "1";
        //clusterForm["err"].value = "1";
        //clusterForm["err_num"].value = "1";
        modelForm["age"].value = "6.6";
        clusterForm["red"].value = "0";
        modelForm["metal"].value = "-3.4";
        //clusterForm["err_num"].value = "1";
        clusterForm["d_num"].value = "3";
        modelForm["age_num"].value = "6.6";
        clusterForm["red_num"].value = "0";
        modelForm["metal_num"].value = "-3.4";
        const data: string[] = (reader.result as string)
            .split("\n")
            .filter((str) => str !== null && str !== undefined && str !== "");
        const datadict = new Map<string, Map<string, number>>(); // initializes a dictionary for the data
        let filters: string[] = [];
        //let stars: starData[] =[];
        data.splice(0, 1);

        //store these in the table

        //request server to get the data
        // put everythin in callback
        //fills the dictionary datadict with objects for each source, having attributes of each filter magnitude
        for (const row of data) {
            let items = row.trim().split(",");
            let src = items[1];
            let filter = items[10] === "K" ? "Ks" : items[10];//interpret K as Ks
            //stars.push(new starData(items[1], parseFloat(items[5]), parseFloat(items[6]), null, null));
            let ra = parseFloat(items[5]);
            let dec = parseFloat(items[6]);
            let mag = parseFloat(items[23]);
            // let mag = parseFloat(items[12]);
            let err = parseFloat(items[13]);
            if (!datadict.has(src)) {
                datadict.set(src, new Map<string, number>());
            }
            if (items[12] !== "") {
                datadict.get(src).set(filter, isNaN(mag) ? null : mag);
                datadict.get(src).set(filter + "err", isNaN(err) ? 0 : err);
                datadict.get(src).set(filter + "ra", isNaN(ra) ? null : ra);
                datadict.get(src).set(filter + "dec", isNaN(dec) ? null : dec);
                if (!filters.includes(filter)) {
                    filters.push(filter);
                }
            }

        }
        
        //sortStarDuplicates(stars);
        //maxMinRaDec(stars);

        //console.log(sortStarDuplicates(stars))
        //console.log(maxMinRaDec(stars))
        //add null values for sources that didn't show up under each filter
        for (const src of datadict.keys()) {
            for (const f of filters) {
                if (!datadict.get(src).has(f)) {
                    datadict.get(src).set(f, null);
                    datadict.get(src).set(f + "err", null);
                    datadict.get(src).set(f + "ra", null);
                    datadict.get(src).set(f + "dec", null);
                }
            }
        }

        let blue = modelForm[modelFormKey(0, 'blue')];
        let red = modelForm[modelFormKey(0, 'red')];
        let lum = modelForm[modelFormKey(0, 'lum')];

        //order filters by temperature
        const knownFilters = ["U", "uprime", "B", "gprime", "V", "rprime", "R", "iprime", "I", "zprime", "Y", "J", "H", "Ks", "K",];
        //knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters, leaving the filters in the file in order.
        filters = knownFilters.filter((f) => filters.indexOf(f) >= 0);
        //if it ain't known ignore it

        const optionList = [];
        const headers: any[] = [];
        const columns: any[] = [];
        let hiddenColumns: any[] = [];
        for (let i = 0; i < filters.length; i++) {
            //makes a list of options for each filter
            optionList.push({
                value: filters[i],
                title: filters[i] + " Mag",
                text: filters[i],
            });
            hiddenColumns[i] = i;
            hiddenColumns[i + filters.length] = i + filters.length; //we have to double up the length for the error data
            headers.push(filters[i] + " Mag"); //every other column is err
            headers.push(filters[i] + "err");
            headers.push(filters[i] + "ra");
            headers.push(filters[i] + "dec");
            columns.push({
                data: filters[i],
                type: "numeric",
                numericFormat: {pattern: {mantissa: 2}},
            });
            columns.push({
                data: filters[i] + "err",
                type: "numeric",
                numericFormat: {pattern: {mantissa: 2}},
            });
            columns.push({
                data: filters[i] + "ra",
                type: "numeric",
                numericFormat: {pattern: {mantissa: 2}},
            });
            columns.push({
                data: filters[i] + "dec",
                type: "numeric",
                numericFormat: {pattern: {mantissa: 2}},
            });
        }
        
        hiddenColumns = hiddenColumns.filter((c) => [0, 4].indexOf(c) < 0); //get rid of the columns we want revealed

        //convrt datadict from dictionary to nested number array tableData
        const tableData: { [key: string]: number }[] = [];
        datadict.forEach((src) => {
            const row: { [key: string]: number } = {};
            for (let filterIndex in filters) {
                row[filters[filterIndex]] = src.get(filters[filterIndex]);
                row[filters[filterIndex] + "err"] = src.get(filters[filterIndex] + "err");
                row[filters[filterIndex] + "ra"] = src.get(filters[filterIndex] + "ra");
                row[filters[filterIndex] + "dec"] = src.get(filters[filterIndex] + "dec");
            }
           
            tableData.push(row);
        });
        for (let c = 0; c < myCharts.length; c++) {
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

            updateHRModel(modelForm, table, [myChart],
                () => {
                    table.updateSettings({
                        data: tableData,
                        colHeaders: headers,
                        columns: columns,
                        hiddenColumns: {columns: hiddenColumns},
                    }); //hide all but the first 3 columns
                    updateTableHeight(table);
                    graphMaxMin.updateMode('auto', c);
                    updateScatter(table, [myChart], clusterForm, modelForm, [2], graphMaxMin);
                    document.getElementById("standardView").click();
                });
        }
    };
    reader.readAsText(file);
}