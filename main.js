// const Jquery = require('jquery');
// const Bootstrap = require('bootstrap');
// const Chartjs = require('chart.js');
// const Handsontable = require('handsontable');
// const FileSaver = require('file-saver');

// initialize the page

const colors = {
    'blue':     '#41a3d1',
    'red':      '#cf4e49',
    'yellow':   '#ced139',
    'purple':   '#c382d1',
    'gray':     '#9a9a9b',
    'orange':   '#ff8e21',
    'bright':   '#ffee51',
    'white':    '#ffffff',
    'black':    '#000000',
};

const tableCommonOptions = {
    rowHeaders: true,
    height: 395,
    width: '100%',
    contextMenu: [
        'undo',
        'redo',
        '---------',
        'row_above',
        'row_below',
        '---------',
        'remove_row'
    ],
    fillHandle: {
        autoInsertRow: true,
    }
};

window.onload = function() {
    let form = document.getElementById('chart-type-form');
    form.onchange = function() {
        chartType(form.elements['chart'].value);
    };
    chartType(form.elements['chart'].value);
};

function chartType(chart) {
    // rewrite HTML content of table & chart
    document.getElementById('table-div').innerHTML = '';
    document.getElementById("chart-div").innerHTML = "<h2>Chart</h2>\n" +
        "<canvas id=\"myChart\" width=\"300\" height=\"200\"></canvas>\n";

    // Enabling download function
    document.getElementById('save-button').onclick = function() {
        let canvas = document.getElementById('myChart');
        canvas.toBlob(function(blob) {
            saveAs(blob, "chart.png");
        });
    };

    let objects;

    if (chart === "line") {
        objects = line();
    } else if (chart === "moon") {
        objects = moon();
    } else if (chart === "scatter") {
        objects = scatter();
    } else if (chart === "venus") {
        objects = venus();
    } else {
        objects = dual();
    }

    let addRow = document.getElementById('add-row-button');
    Handsontable.dom.addEvent(addRow, 'click', function() {
        objects[0].alter('insert_row');
    });
}

function line() {
    let tableData = [
        {x: 0, y: 25},
        {x: 1, y: 16},
        {x: 2, y: 9},
        {x: 3, y: 4},
        {x: 4, y: 1},
        {x: 5, y: 4},
        {x: 6, y: 9},
        {x: 7, y: 16},
        {x: 8, y: 25},
        {x: 9, y: 36},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
    ];

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x', 'y'],
        maxCols: 2,
        columns: [
            {data: 'x', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'y value',
                data: chartData,
                borderColor: rgbString(colors['blue']),
                backgroundColor: rgbString(colors['white'], 0),
                borderWidth: 2,
                lineTension: 0.1,
                fill: false,
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
            }
        }
    });

    hot.updateSettings({
        afterChange: function() {
            updateLine(tableData, myChart);
        }
    });

    updateLine(tableData, myChart);

    return [hot, myChart];
}

function moon() {

}

function scatter() {
    let tableData = [];
    for (let i = 0; i < 15; i++) {
        tableData[i] = {
            'la': Math.random() * 40.0 - 20.0,
            'lo': Math.random() * 40.0 - 20.0,
            'di': Math.random() * 20.0,
        };
    }

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Latitude', 'Longitude', 'Distance'],
        maxCols: 3,
        columns: [
            {data: 'la', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'lo', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'di', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: chartData,
                    backgroundColor: rgbString(colors['orange']),
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                }, {
                    label: 'Sun',
                    data: [{x: 0, y: 0}],
                    backgroundColor: rgbString(colors['bright']),
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }]
            }
        }
    });

    hot.updateSettings({
        afterChange: function() {
            updateScatter(tableData, myChart);
        }
    });

    updateScatter(tableData, myChart);

    return [hot, myChart];
}

function venus() {

}

function dual() {
    let tableData = [
        {x1: 0, y1: 25, x2: 1, y2: Math.sqrt(100)},
        {x1: 1, y1: 16, x2: 2, y2: Math.sqrt(200)},
        {x1: 2, y1: 9, x2: 3, y2: Math.sqrt(300)},
        {x1: 3, y1: 4, x2: 4, y2: Math.sqrt(400)},
        {x1: 4, y1: 1, x2: 5, y2: Math.sqrt(500)},
        {x1: 5, y1: 4, x2: 6, y2: Math.sqrt(600)},
        {x1: 6, y1: 9, x2: 7, y2: Math.sqrt(700)},
        {x1: 7, y1: 16, x2: 8, y2: Math.sqrt(800)},
        {x1: 8, y1: 25, x2: 9, y2: Math.sqrt(900)},
        {x1: 9, y1: 36, x2: 10, y2: Math.sqrt(1000)},
        {x1: '', y1: '', x2: 11, y2: Math.sqrt(1100)},
        {x1: '', y1: '', x2: 12, y2: Math.sqrt(1200)},
        {x1: '', y1: '', x2: 13, y2: Math.sqrt(1300)},
        {x1: '', y1: '', x2: 14, y2: Math.sqrt(1400)},
        {x1: '', y1: '', x2: 15, y2: Math.sqrt(1500)},
    ];

    let chartData1 = [];
    let chartData2 = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x1', 'y1', 'x2', 'y2'],
        maxCols: 4,
        columns: [
            {data: 'x1', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y1', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'x2', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y2', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'y1',
                    data: chartData1,
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                }, {
                    label: 'y2',
                    data: chartData2,
                    borderColor: rgbString(colors['red']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
            }
        }
    });

    hot.updateSettings({
        afterChange: function() {
            updateDual(tableData, myChart, 0);
            updateDual(tableData, myChart, 1);
        }
    });

    updateDual(tableData, myChart, 0);
    updateDual(tableData, myChart, 1);

    return [hot, myChart];
}

function updateLine(table, myChart, dataSet = 0) {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < table.length; i++) {
        if (table[i]['x'] === '' || table[i]['y'] === '') {
            continue;
        }
        chart[start++] = {x: table[i]['x'], y: table[i]['y']};
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

function updateScatter(table, myChart) {
    let start = 0;
    let chart = myChart.data.datasets[0].data;
    for (let i = 0; i < table.length; i++) {
        let la = table[i]['la'];
        let lo = table[i]['lo'];
        let di = table[i]['di'];
        if (la === '' || lo === '' || di === '') {
            continue;
        }
        chart[start++] = {
            x: Math.cos(la / 180 * Math.PI) * di * Math.cos(lo / 180 * Math.PI),
            y: Math.cos(la / 180 * Math.PI) * di * Math.sin(lo / 180 * Math.PI),
        }
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

function updateDual(table, myChart, dataSet = 0) {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < table.length; i++) {
        let xKey = 'x' + (dataSet + 1);
        let yKey = 'y' + (dataSet + 1);
        if (table[i][xKey] === '' || table[i][yKey] === '') {
            continue;
        }
        chart[start++] = {x: table[i][xKey], y: table[i][yKey]};
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

function rgbString(rgb, opacity = 1) {
    let r = hexToDecimal(rgb, 1, 2);
    let g = hexToDecimal(rgb, 3, 4);
    let b = hexToDecimal(rgb, 5, 6);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
}

function hexToDecimal(hex, s, t) {
    let result = 0;
    for (let i = s; i <= t; i++) {
        result <<= 4;
        if (hex[i] >= '0' && hex[i] <='9') {
            result += hex[i].charCodeAt(0) - '0'.charCodeAt(0);
        } else {
            result += hex[i].charCodeAt(0) - 'a'.charCodeAt(0) + 10;
        }
    }
    return result;
}