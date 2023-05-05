import Handsontable from "handsontable";
import {deActivateInterfaceOnFetch, rangeCheckControl, updateClusterProDefaultLabels} from "./chart-cluster-interface";
import {filterWavelength, modelFormKey} from "./chart-cluster-util";
import {changeOptions, updateTableHeight} from "../util";
import {Chart} from "chart.js";
import {updateHRModel} from "./chart-cluster-model";
import {graphScale, updateScatter} from "./chart-cluster-scatter";
import {chart2Scale, proFormMinmax, updateChart2, updateClusterProScatter} from "./chart-cluster-pro-util";

// export function clusterFileUploadBeta(
//     evt: Event,
//     table: Handsontable,
//     myCharts: Chart[],
//     graphMaxMin: graphScale,
//     isCluster3: boolean =false,
//     proForm: ClusterProForm = null,
// ){
//     const file = (evt.target as HTMLInputElement).files[0];
//
//     if (file === undefined) {
//         return;
//     }
//
//     // File type validation
//     if (
//         !file.type.match("(text/csv|application/vnd.ms-excel)") &&
//         !file.name.match(".*.csv")
//     ) {
//         console.log("Uploaded file type is: ", file.type);
//         console.log("Uploaded file name is: ", file.name);
//         alert("Please upload a CSV file.");
//         return;
//     }
//     const reader = new FileReader();
//     reader.onload = () => {
//         let readerString: string = reader.result as string;
//         // @ts-ignore remove all spaces from input
//         readerString = readerString.replaceAll(' ', '');
//         // remove all blank rows
//         const rawData = readerString.split("\n")
//             .filter((str: string) => str !== null && str !== undefined && str !== "" && str !== "\r");
//         // some sort of implementation to generate rowobject for handsontable
//     }
//     reader.readAsText(file);
// }

export function updateClusterOnNewData(table: Handsontable,
                                       tableData: { [key: string]: number }[],
                                       filters: string[],
                                       myCharts: Chart[],
                                       graphMaxMin: graphScale,
                                       pmChart: Chart = null,
) {
    const knownFilters = Object.keys(filterWavelength);
    // knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters, leaving the filters in the file in order.
    filters = knownFilters.filter((f) => filters.indexOf(f) >= 0);
    // resetClusterFormValue(true);
    clusterWriteHandsonTable(table, tableData, filters);
    for (let c = 0; c < 2; c++) {
        setFilterForClusterform(c, filters);
    }

    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
    const chartCounts = myCharts.length;
    updateHRModel(clusterForm, table, myCharts,
        (c: number) => {
            if (c === chartCounts - 1) {
                for (let i = 0; i < chartCounts; i++) {
                    graphMaxMin.updateMode('auto', i);
                    updateScatter(table, [myCharts[i]], clusterForm, [2], graphMaxMin, -1, clusterProForm);
                    myCharts[i].update();
                }
                if (pmChart) {
                    const proMinMax = proFormMinmax(table, clusterForm);
                    const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
                    // updateProForm(proMinMax, clusterProForm);
                    updateClusterProScatter(table, pmChart, clusterForm);
                    updateChart2(pmChart, clusterProForm, proMinMax);
                    chart2Scale(pmChart, proMinMax);
                    pmChart.update();
                    updateClusterProDefaultLabels(myCharts);
                }
                document.getElementById("standardView").click();

                deActivateInterfaceOnFetch(true);
            }
        }, true)
}


function clusterWriteHandsonTable(table: Handsontable, tableData: { [key: string]: number }[], filters: string[]) {
    const headerNColumn = filtersToLists(filters);
    // @ts-ignore
    table.updateSettings({
        data: tableData,
        colHeaders: headerNColumn.headers,
        columns: headerNColumn.columns,
        hiddenColumns: {
            columns: [],
            copyPasteEnabled: false, // exclude hidden columns from copying and pasting
        }
    })
    updateTableHeight(table);
}


function setFilterForClusterform(chartNum: number, filters: string[]) {
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const blue = clusterForm[modelFormKey(chartNum, 'blue')];
    const red = clusterForm[modelFormKey(chartNum, 'red')];
    const lum = clusterForm[modelFormKey(chartNum, 'lum')];
    const filterOptions = filtersToLists(filters).options;
    changeOptions(blue, filterOptions);
    changeOptions(red, filterOptions);
    changeOptions(lum, filterOptions);
    blue.value = filters[0];
    red.value = filters[1];
    lum.value = filters[1];
}

function filtersToLists(filters: string[]): { headers: any[], columns: any[], options: any[] } {
    let headers: any[] = [];
    let columns: any[] = [];
    let options = [];
    const infoList = [
        {name: 'id', type: 'text'},
        {name: 'isValid', type: 'text'},
    ];
    for (const key of infoList) {
        headers.push(key.name);
        columns.push({data: key.name, type: key.type,});
    }
    const byFilterInfoList = [
        {name: 'Mag', type: 'numeric'},
        {name: 'err', type: 'numeric'},
        {name: 'ra', type: 'numeric'},
        {name: 'dec', type: 'numeric'},
        {name: 'dist', type: 'numeric'},
        {name: 'pmra', type: 'numeric'},
        {name: 'pmdec', type: 'numeric'},
    ];
    for (const filter of filters) {
        options.push({
            value: filter,
            title: filter + " Mag",
            text: filter,
        });
        for (const key of byFilterInfoList) {
            headers.push(filter + " " + key.name);
            if (key.type === 'numeric') {
                columns.push({
                    data: filter + key.name,
                    type: key.type,
                    numericFormat: {pattern: {mantissa: 5}},
                });
            } else {
                columns.push({
                    data: filter + key.name,
                    type: key.type,
                });
            }
        }
    }
    return {headers, columns, options}
}

/**
 * Reset cluster form input values to default
 *
 * @param isRangeReset: if true, uncheck and reset range checkbox
 */
export function resetClusterFormValue(isRangeReset: boolean, isClusterPro: boolean = false) {
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    clusterForm["d"].value = Math.log(3).toString();
    clusterForm["err"].value = "1";
    clusterForm["err_num"].value = "1";
    clusterForm["age"].value = "6.6";
    clusterForm["bv"].value = "0";
    clusterForm["metal"].value = "-3.4";
    clusterForm["distrange"].value = "30";
    //clusterForm["err_num"].value = "1";
    clusterForm["d_num"].value = "3";
    clusterForm["age_num"].value = "6.6";
    clusterForm["red_num"].value = "0";
    clusterForm["metal_num"].value = "-2.2";
    clusterForm["distrange_num"].value = "30";
    if (isClusterPro) {
        clusterForm["rv"].value = "3.1";
        clusterForm["rv_num"].value = "3.1";
    }
    if (isRangeReset)
        rangeCheckControl()
}
