var hot;

function line() {

    let headers = ['x', 'y'];

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
    hot = new Handsontable(container, {
        data: tableData,
        rowHeaders: true,
        colHeaders: headers,
        maxCols: 2,
        height: 400,
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

    hot.updateSettings({
        afterChange: function() {
            updateChart(chartData, tableData, myChart);
        }
    });

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'y value',
                data: chartData,
                borderColor: 'rgba(20, 20, 20, 1)',
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
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    updateChart(chartData, tableData, myChart);

    // Enabling download function
    // let canvas = document.getElementById('myChart');


}

function moon() {
    let
        example = document.getElementById('input-table'),
        hot;

    let headers = ["Red", "Blue", "Yellow", "Green", "Purple", "Orange", "Pink", 'Brown'];
    let myData = [
        [5, 10, 3, 5, 2, 3, 5, 1],
        [9, 9, 3, 10, 8, 7, 7, 2],
        [5, 1, 10, 6, 7, 9, 4, 8]
    ];
    let colheaders = ['Mark', 'Anna', 'Diana'];

    hot = new Handsontable(example, {
        data: myData,
        rowHeaders: colheaders,
        colHeaders: headers,
        colWidths: 88,
        maxCols: 10,
        fillHandle: {
            autoInsertRow: false,
        }
    });

    hot.updateSettings({
        afterChange: function() {
            myChart.update()
        }
    });


    let options = {
        type: 'bar',
        data: {
            labels: headers,
            datasets: [{
                label: colheaders[0],
                data: myData[0],
                borderWidth: 1,
                backgroundColor: 'rgb(255, 236, 217)'
            }, {
                label: colheaders[1],
                data: myData[1],
                borderWidth: 1,
                backgroundColor: 'rgb(235, 224, 255)'
            }, {
                label: colheaders[2],
                data: myData[2],
                borderWidth: 1,
                backgroundColor: 'rgb(219, 242, 242)'
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        reverse: false
                    }
                }]
            }
        }
    };

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, options);
}

function updateChart(chart, table, myChart) {
    let start = 0;
    for (let i = 0; i < table.length; i++) {
        if (table[i]['x'] === "" || table[i]['y'] === "") {
            continue;
        }
        console.log('reach, start = ' + start);
        chart[start] = {x: table[i]['x'], y: table[i]['y']};
        start += 1;
    }
    console.log('length = ' + chart.length + ', start = ' + start);
    while (chart.length !== start) {
        chart.pop();
    }
    console.log(chart);
    myChart.update(0);
}