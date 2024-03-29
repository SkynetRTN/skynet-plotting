"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import {colors} from "./config";
import {linkInputs, throttle, updateLabels, updateTableHeight,} from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale, updateScatter} from "./chart-cluster-utils/chart-cluster-scatter";
import {
    clusterProButtons,
    insertClusterControls,
    rangeCheckControl
} from "./chart-cluster-utils/chart-cluster-interface";
import {defaultTable} from "./chart-cluster-utils/chart-cluster-dummy";
import {HRrainbow} from "./chart-cluster-utils/chart-cluster-util";
import {updateHRModel} from "./chart-cluster-utils/chart-cluster-model";

Chart.register(zoomPlugin);

/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart, modelForm, graphScale]}:
 */
export function cluster2(): [Handsontable, Chart[], ClusterForm, graphScale] {
    insertClusterControls(2);
    //make graph scaling options visible to users

    //setup two charts
    document.getElementById('myChart').remove();
    //document.getElementById('myChart3').remove();
    //document.getElementById('myChart4').remove();
    document.getElementById('chart-div1').style.display = 'block';
    document.getElementById('chart-div2').style.display = 'block';
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label2').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('axis-label4').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X<sub>1</sub> Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y<sub>1</sub> Axis";
    document.getElementById('axisSet1').className = 'col-sm-6';
    document.getElementById('axisSet2').style.display = 'inline';
    document.getElementById('chartTag1').style.display = "inline";
    document.getElementById('chartTag2').style.display = "inline";

    // Link each slider with corresponding text box
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    linkInputs(clusterForm['err'], clusterForm["err_num"], 0, 1, 0.05, 1, false, true, 0, 999)
    linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
    linkInputs(clusterForm["distrange"], clusterForm["distrange_num"], 0, 100, 0.01, 100, false, false);
    linkInputs(clusterForm["age"], clusterForm["age_num"], 6.6, 10.2, 0.01, 6.6);
    linkInputs(clusterForm["bv"], clusterForm["red_num"], 0, 1, 0.01, 0, false, true, 0, 100000000);
    linkInputs(clusterForm["metal"], clusterForm["metal_num"], -2.2, 0.7, 0.01, -2.2);
    rangeCheckControl(true)

    //declare graphScale limits
    let graphMinMax = new graphScale(2);

    // create table
    const container = document.getElementById("table-div");
    const hot = defaultTable(container)
    // unhide table whenever interface is selected
    document.getElementById("chart-type-form").addEventListener("click", () => {
        container.style.display = "block";
        document.getElementById('add-row-button').hidden = false;
        document.getElementById('file-upload-button').hidden = false;
    });


    // create chart
    const ctx1 = (document.getElementById("myChart1") as HTMLCanvasElement).getContext('2d');

    const myChart1 = new Chart(ctx1, {
        type: "line",
        data: {
            labels: ["Model", "Data"],
            datasets: [
                {
                    type: "line",
                    label: "",
                    data: null, // will be generated later
                    borderColor: colors["black"],
                    backgroundColor: colors["black"],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                    parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
                },
                {
                    type: "line",
                    label: "Model2",
                    data: null, // will be generated later
                    borderColor: colors["black"],
                    backgroundColor: colors["black"],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                    parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
                },
                {
                    type: "scatter",
                    label: "Data",
                    data: [{x: 0, y: 0}],
                    backgroundColor: colors["gray"],
                    borderColor: colors["black"],
                    borderWidth: 0.2,
                    fill: false,
                    showLine: false,
                    pointRadius: 2,
                    pointHoverRadius: 7,
                    immutableLabel: true,
                    parsing: {}
                },
            ],

        },
        options: {
            responsive: true,
            //maintainAspectRatio: false,
            aspectRatio: 0.7290,
            hover: {
                mode: "nearest",
            },
            scales: {
                x: {
                    //label: 'B-V',
                    type: "linear",
                    position: "bottom",
                },
                y: {
                    //label: 'V',
                    reverse: true,
                    suggestedMin: 0,
                },
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        mode: 'x',
                    },
                },
                title: {
                    display: true,
                    align: "start",
                    padding: {
                        top: 13,
                        bottom: 10,
                    }
                },
                legend: {
                    display: false,
                    align: "end",
                    labels: {
                        filter: function (item) {
                            // Logic to remove a particular legend item goes here
                            //remove the legend item for the model2
                            // const aff = !item.text.includes("");
                            const eff = !item.text.includes("Model2");
                            const off = !item.text.includes("Data");
                            return eff && off;
                        }
                    }
                }
            }
        },
    });

    const ctx2 = (document.getElementById("myChart2") as HTMLCanvasElement).getContext('2d');

    const myChart2 = new Chart(ctx2, {
        type: "line",
        data: {
            labels: ["Model", "Data"],
            datasets: [
                {
                    type: "line",
                    label: "Model",
                    data: null, // will be generated later
                    borderColor: colors["black"],
                    backgroundColor: colors["black"],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                    parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
                },
                {
                    type: "line",
                    label: "Model2",
                    data: null, // will be generated later
                    borderColor: colors["black"],
                    backgroundColor: colors["black"],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                    parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
                },
                {
                    type: "scatter",
                    label: "Data",
                    data: [{x: 0, y: 0}],
                    backgroundColor: colors["gray"],
                    borderColor: colors["black"],
                    borderWidth: 0.2,
                    fill: false,
                    showLine: false,
                    pointRadius: 2,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                    parsing: {}
                },
            ],

        },
        options: {
            responsive: true,
            //maintainAspectRatio: false,
            aspectRatio: 0.7290,
            hover: {
                mode: "nearest",
            },
            scales: {
                x: {
                    //label: 'B-V',
                    type: "linear",
                    position: "bottom",
                },
                y: {
                    //label: 'V',
                    reverse: true,
                    suggestedMin: 0,
                },
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        mode: 'x',
                    },
                },
                title: {
                    display: true,
                    align: 'start',
                    color: 'white',
                    font: {
                        size: 1
                    },
                    padding: {
                        top: 25.50,
                        bottom: -14,
                    }
                },
                legend: {
                    align: "end",
                    labels: {
                        filter: function (item) {
                            // Logic to remove a particular legend item goes here
                            return !item.text.includes('Model2');
                        }
                    }
                }
            }
        },
    });

    //create graph control buttons and assign onZoom onPan functions to deactivate radio button selections
    let graphControl = new ChartScaleControl([myChart1, myChart2], clusterForm, graphMinMax);
    myChart1.options.plugins.zoom.zoom.onZoom = () => {
        graphControl.zoompanDeactivate(clusterForm)
    };
    myChart1.options.plugins.zoom.pan.onPan = () => {
        graphControl.zoompanDeactivate(clusterForm)
    };
    myChart2.options.plugins.zoom.zoom.onZoom = () => {
        graphControl.zoompanDeactivate(clusterForm, 1)
    };
    myChart2.options.plugins.zoom.pan.onPan = () => {
        graphControl.zoompanDeactivate(clusterForm, 1)
    };
    let frameChart1 = () => {
        document.getElementById('frameChart1').click()
    };
    let frameChart2 = () => {
        document.getElementById('frameChart2').click()
    };
    document.getElementById('chart-div1').onmousedown = frameChart1;
    document.getElementById('chart-div2').onmousedown = frameChart2;
    clusterProButtons(false);

    //Adjust the gradient with the window size
    window.onresize = function () {
        setTimeout(function () {
            myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
                clusterForm["red"].value, clusterForm["blue"].value);
            myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
                clusterForm["red2"].value, clusterForm["blue2"].value);
            myChart1.update();
            myChart2.update();
            updateTableHeight(hot);
        }, 10)
    }
    const update = function () {
        //console.log(tableData);
        updateTableHeight(hot);
        updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax);
    };
    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });
    const fps = 100;
    const frameTime = Math.floor(1000 / fps);

    // link chart to model form (slider + text)
    // modelForm.oninput=
    clusterForm.oninput = throttle(function () {
        updateHRModel(clusterForm, hot, [myChart1, myChart2], (chartNum: number) => {
                updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, chartNum);
            }
        );
    }, 100);

    //initializing website

    update();
    //temp fix for chart 2 HR rainbow color not reset
    document.getElementById("myChart1").click();
    document.getElementById("myChart2").click();
    updateHRModel(clusterForm, hot, [myChart1, myChart2]);
    document.getElementById("extra-options").style.display = "block";
    document.getElementById("standardView").click();
    (document.getElementById("distrangeCheck") as HTMLInputElement).checked = false
    myChart1.options.plugins.title.text = "Title";
    myChart1.options.scales["x"].title.text = "x1";
    myChart1.options.scales["y"].title.text = "y1";
    myChart2.options.scales["x"].title.text = "x2";
    myChart2.options.scales["y"].title.text = "y2";
    updateLabels(myChart1, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, 0);
    updateLabels(myChart2, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, 1);
    const chartTypeForm = document.getElementById('chart-type-form') as HTMLFormElement;
    chartTypeForm.addEventListener("change", function () {
        //destroy the chart
        //testing a bunch of creating charts and destroying them to make the thing work
        myChart1.destroy();
        myChart2.destroy();
    });
    return [hot, [myChart1, myChart2], clusterForm, graphMinMax];

}
