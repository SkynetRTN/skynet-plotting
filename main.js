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
        objects = double();
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
            {data: 'x', type: 'numeric'},
            {data: 'y', type: 'numeric'},
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
                borderWidth: 2,
                lineTension: 0.1,
                fill: false,
                backgroundColor: rgbString(colors['white'], 1),
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
                    pointBorderWidth: 2,
                },
                {
                    label: 'Sun',
                    data: [{x: 0, y: 0}],
                    backgroundColor: rgbString(colors['bright']),
                    pointRadius: 10,
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

function double() {

}

function updateLine(table, myChart) {
    let start = 0;
    let chart = myChart.data.datasets[0].data;
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