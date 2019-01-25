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
    document.getElementById('input-table').innerHTML = '';
    document.getElementById("chart-div").innerHTML = "<h2>Chart</h2>\n" +
        "<canvas id=\"myChart\" width=\"300\" height=\"200\"></canvas>\n" +
        "<button id=\"save-button\">Save Chart Image</button>";

    // Enabling download function
    document.getElementById('save-button').onclick = function() {
        let canvas = document.getElementById('myChart');
        canvas.toBlob(function(blob) {
            saveAs(blob, "chart.png");
        });
    };

    if (chart === "line") {
        line();
    } else if (chart === "moon") {
        moon();
    } else if (chart === "scatter") {
        scatter();
    } else if (chart === "venus") {
        venus();
    } else {
        double();
    }
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
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
    ];

    let chartData = [];

    let container = document.getElementById('input-table');
    let hot = new Handsontable(container, {
        data: tableData,
        rowHeaders: true,
        colHeaders: ['x', 'y'],
        maxCols: 2,
        height: 395,
        width: '100%',
        contextMenu: ['undo', 'redo', '---------', 'row_above', 'row_below', '---------', 'remove_row'],
        columns: [
            {data: 'x', type: 'numeric'},
            {data: 'y', type: 'numeric'},
        ],
        fillHandle: {
            autoInsertRow: true,
        }
    });

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'y value',
                data: chartData,
                borderColor: 'rgba(65, 163, 209, 1)',
                borderWidth: 2,
                lineTension: 0.1,
                fill: false,
                backgroundColor: 'rgba(0, 0, 0, 0)',
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    hot.updateSettings({
        afterChange: function() {
            updateChart(tableData, myChart);
        }
    });

    updateChart(tableData, myChart);
}

function moon() {

}

function scatter() {

}

function venus() {

}

function double() {

}

function updateChart(table, myChart) {
    let start = 0;
    let chart = myChart.data.datasets[0].data;
    console.log(chart);
    for (let i = 0; i < table.length; i++) {
        if (table[i]['x'] === "" || table[i]['y'] === "") {
            continue;
        }
        // console.log('reach, start = ' + start);
        chart[start] = {x: table[i]['x'], y: table[i]['y']};
        start += 1;
    }
    // console.log('length = ' + chart.length + ', start = ' + start);
    while (chart.length !== start) {
        chart.pop();
    }
    // console.log(chart);
    myChart.update(0);
}

function rgbString(rgb) {
    let r = hexToDecimal(rgb, 1, 2);
    let g = hexToDecimal(rgb, 3, 4);
    let b = hexToDecimal(rgb, 5, 6);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', 0)';
}

function hexToDecimal(hex, s, t) {
    let result = 0;
    for (let i = s; i <= t; i++) {
        result <<= 4;
        if (hex[i] >= '0' && hex[i] <='9') {
            result += hex[i] - '0';
        } else {
            result += hex[i] - 'A' + 10;
        }
    }
    return result;
}