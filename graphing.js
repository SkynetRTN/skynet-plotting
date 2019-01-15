function line() {

    var headers = ['x', 'y'];

    var myData = [
        [5.51, 25.72],
        [7.93, 56.47],
        [10.02, 101.53],
        [11.59, 136.88],
        [15.53, 136.09],
    ];

    console.log('rendering the spreadsheet');

    var container = document.getElementById('input-table');
    var hot = new Handsontable(container, {
        data: myData,
        rowHeaders: true,
        colHeaders: headers,
        filters: true,
        dropdownMenu: true,
        contextMenu: ['undo', 'redo', '---------', 'row_above', 'row_below', '---------', 'remove_row'],
        fillHandle: {
            autoInsertRow: true,
        }
    });

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [{
                label: '# of Votes',
                data: [20, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
    console.log('doing chart');
}

function moon() {
    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: '# of Votes',
                data: [
                    {x: 1.15, y: 12.95},
                    {x: 3.0566, y: 4.27},
                    {x: 13.175, y: 20.06},
                ],
                borderColor: 'rgba(255,99,132,1)',
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
}