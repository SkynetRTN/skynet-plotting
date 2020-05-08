'use strict';

/**
 *  This function takes the data in a dictionary object and updates a Chartjs object with the data. The
 *  dataset number for the Chartjs object and the keys for the x and y values are given in order to
 *  correctly update when there are multiple datasets in the Chartjs object or in the dictionary.
 *  @param tableData:   The dictionary object that provides data
 *  @param myChart: The Chartjs object
 *  @param dataSet: The number of line to be updated in the Chartjs object.
 *  @param xKey:    The key for x values in the dictionary.
 *  @param yKey:    The key for y values in the dictionary.
 */
export function updateLine(tableData, myChart, dataSet = 0, xKey = 'x', yKey = 'y') {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i][xKey] === '' || tableData[i][yKey] === '' ||
            tableData[i][xKey] === null || tableData[i][yKey] === null) {
            continue;
        }
        chart[start++] = { x: tableData[i][xKey], y: tableData[i][yKey] };
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

/**
 *  This function takes the labels from the chart and updates the the data property of the form with the labels.
 *  @param myChart: The Chartjs object
 *  @param form:    The form to be updated.
 */
export function updateLabels(myChart, form) {
    let labels = "";
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].hidden && !myChart.data.datasets[i].immutableLabel) {
            if (labels !== "") {
                labels += ", ";
            }
            labels += myChart.data.datasets[i].label;
        }
    }
    form.elements['data'].value = labels;
}

/**
 *  This function updates the height for the Handsontable object based on the number of rows it has.
 *  The min and max height is set to be 5 rows and the height of the right side of the page, respectively.
 *  @param table:   The Handsontable object whose height is to be updated.
 */
export function updateTableHeight(table) {
    const rowHeights = 23;
    const columnHeaderHeight = 26;

    let typeForm = document.getElementById('chart-type-form').clientHeight;
    let inputDiv = document.getElementById('input-div').clientHeight;
    let chartDiv = document.getElementById('chart-div').clientHeight;
    let infoForm = document.getElementById('chart-info-form').clientHeight;

    let minHeight = Math.min(5, table.countRows()) * rowHeights + columnHeaderHeight + 5;
    let maxHeight = Math.max(minHeight, chartDiv + infoForm - typeForm - inputDiv);
    let height = table.countRows() * rowHeights + columnHeaderHeight + 5;

    if (height > maxHeight) {
        height = maxHeight;
    }

    table.updateSettings({ stretchH: 'none', });
    table.updateSettings({ height: height, });
    table.updateSettings({
        stretchH: 'all',
    });
}
