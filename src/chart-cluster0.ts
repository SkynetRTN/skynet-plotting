"use strict";
import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { colors } from "./config";
import {linkInputs,updateLabels, throttle, chartDataDiff} from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale} from "./chart-cluster-utils/chart-cluster-scatter";
import { insertClusterSimControls} from "./chart-cluster-utils/chart-cluster-interface";
import {defaultTable } from "./chart-cluster-utils/chart-cluster-dummy";
import { HRrainbow, baseUrl, httpGetAsync, modelFormKey, modelFormKeys, pointMinMax  } from "./chart-cluster-utils/chart-cluster-util";
import { generateURL} from "./chart-cluster-utils/chart-cluster-model";
import { ScatterDataPoint } from "chart.js";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart, modelForm, graphScale]}:
 */
export function cluster0(): [Handsontable, Chart[], ModelForm, graphScale] {
  insertClusterSimControls();
  //make graph scaling options visible to users
  document.getElementById('axis-label1').style.display = 'inline';
  document.getElementById('axis-label3').style.display = 'inline';
  document.getElementById('xAxisPrompt').innerHTML = "X Axis";
  document.getElementById('yAxisPrompt').innerHTML = "Y Axis";
  //Declare UX forms. Seperate based on local and server side forms.
  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const modelForm = document.getElementById("model-form") as ModelForm;
  const clusterSimForm = document.getElementById("clustersim-form") as ClusterSimForm;

  // Link each slider with corresponding text box
  linkInputs(clusterSimForm["starNum"], clusterSimForm["starNum_num"], 1, 100, 1, 1);
  linkInputs(clusterSimForm["noise"], clusterSimForm["noise_num"], 0.1, 100, 0.01, 0.1, true);
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 0.1, true);
  linkInputs(clusterForm["distScatter"], clusterForm["distScatter_num"], 0, 100, 0.01, 0);
  linkInputs(clusterForm["red"], clusterForm["red_num"], 0, 1, 0.01, 0, false, true, 0, 100000000);
  linkInputs(clusterForm["redScatter"], clusterForm["redScatter_num"], 0, 100, 0.01, 0);
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.3, 0.01, 6.6);
  linkInputs(modelForm["ageScatter"], modelForm["ageScatter_num"], 0, 100, 0.01, 0);
  linkInputs(modelForm["metal"], modelForm["metal_num"], -3.4, 0.2, 0.01, -3.4);
  linkInputs(modelForm["metalScatter"], modelForm["metalScatter_num"], 0, 100, 0.01, 0);
  //declare graphScale limits
  let graphMinMax = new graphScale();

  // create table
  const container = document.getElementById("table-div");
  const hot = defaultTable(container)
  // hide table whenever interface is selected
  document.getElementById("chart-type-form").addEventListener("click", () => {
  container.style.display = "none";
  document.getElementById('add-row-button').hidden = true;
  document.getElementById('file-upload-button').hidden = true;
  });
  // create chart
  const canvas = document.getElementById("myChart") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  const myChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        type: "line",
        label: "Model1",
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
      },]
    },
    options: {
      hover: { mode: "nearest", },
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
        // legend: {
        //   onClick: newLegendClickHandler,
        // }
        legend: {
          display: false,
        }
      }
    },
  });
  //add an event listener that removes all datasets and updates addDatasets when the user changes the number of stars
  //clusterSimForm.addEventListener("change", () => {
    //myChart.data.datasets = [];
    //addDatasets(myChart, clusterSimForm);
    //updateHRModelSim(modelForm, hot, [myChart]);
  //});
  console.log(myChart.data.datasets[0])
  // update chart whenever the model form changes
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);
  clusterSimForm.oninput = throttle(
    function() {
    myChart.data.datasets = [];
    addDatasets(myChart, clusterSimForm);
    updateHRModelSim(modelForm, hot, [myChart]);
    }, frameTime);
  clusterForm.oninput = throttle(
    function () {
      updateHRModelSim(modelForm, hot, [myChart]);
    },
    frameTime);

  // link chart to model form (slider + text). BOTH datasets are updated because both are affected by the filters.
  modelForm.oninput = throttle(function () {
    updateHRModelSim(modelForm, hot, [myChart]);

  }, 100);
  //customize cursor icon
  document.getElementById('chart-div').style.cursor = "move"

  //create graph control buttons and assign onZoom onPan functions to deactivate radio button selections
  let graphControl = new ChartScaleControl([myChart], modelForm, graphMinMax);
  myChart.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm)}
  myChart.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm)}

  //Adjust the gradient with the window size
  window.onresize = function () {
  }
  //initializing website
  updateHRModelSim(modelForm, hot, [myChart]);
  document.getElementById("extra-options").style.display = "block";
  document.getElementById("standardView").click();


  myChart.options.plugins.title.text = "Title";
  myChart.options.scales["x"].title.text = "x";
  myChart.options.scales["y"].title.text = "y";
  updateLabels(
    myChart,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false
  );
  
  return [hot, [myChart], modelForm, graphMinMax];
}
  //make a function that makes more datasets and adds them to the chart based on starNum
  export function addDatasets(chart: Chart, clusterSimForm: ClusterSimForm) {
    let starNum = parseFloat(clusterSimForm["starNum_num"].value);
    for (let i = 0; i < starNum; i++) { 
      chart.data.datasets.push({
        type: "line",
        label: "Model" + (i + 1),
        data: null, // will be generated later
        borderColor: colors["black"],
        backgroundColor: colors["black"],
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        fill: false,
        immutableLabel: true,
        parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
      },)
      
      console.log(chart.data.datasets);
    }
    console.log(chart.data.datasets);
    console.log(chart.data.datasets[0]);
    chart.update();
  }
  export function updateHRModelSim(modelForm: ModelForm, hot: Handsontable, charts: Chart[], callback: Function = () => { }, isChart: boolean = false) {
    function modelFilter(dataArray: number[][], iSkip: number): [ScatterDataPoint[], ScatterDataPoint[], { [key: string]: number }] {
        let form: ScatterDataPoint[] = [] //the array containing all model points
        let scaleLimits: { [key: string]: number } = {minX: NaN, minY: NaN, maxX: NaN, maxY: NaN,};
        for (let i = 0; i < dataArray.length; i++) {
            let x_i: number = dataArray[i][0];
            let y_i: number = dataArray[i][1];
            let row: ScatterDataPoint = {x: x_i, y: y_i};
            scaleLimits = pointMinMax(scaleLimits, dataArray[i][0], dataArray[i][1]);
            form.push(row);
        }
        iSkip = iSkip > 0? iSkip : 0;
        let age = parseFloat(modelForm['age_num'].value);
        if (age < 6.6)
            age = 6.6;
        else if (age > 10.3)
            age = 10.3;
        let iEnd =  Math.round(((-25.84 * age + 451.77) + (-17.17*age**2+264.30*age-753.93))/2)
        return [form.slice(0, iSkip), form.slice(iSkip, iEnd), scaleLimits]
    }
    let reveal: string[] = [];
    for (let c = 0; c < charts.length; c++) {
        let chart = charts[c];
        reveal = reveal.concat(modelFormKeys(c, modelForm));
        httpGetAsync(generateURL(modelForm, c),
            (response: string) => {
                let json = JSON.parse(response);
                let dataTable: number[][] = json['data'];
                let filteredModel = modelFilter(dataTable, json['iSkip']);
                for (c = 0; c < chart.data.datasets.length; c++) {
                    chart.data.datasets[c].data = filteredModel[1];
                }
                callback(c);
                if (!isChart)
                    chart.update("none");
            },
            () => {
                console.trace(generateURL(modelForm, c))
                callback(c);
                if (!isChart)
                    chart.update("none");
            },
        );
    }
    //update table
    let columns: string[] = hot.getColHeader() as string[];
    let hidden: number[] = [];
    for (const col in columns) {
        if (columns[col].includes('Mag')){
            columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
        }
        if (!reveal.includes(columns[col])) {
            //if the column isn't selected in the drop down, hide it
            hidden.push(parseFloat(col));
        }
    }
    hot.updateSettings({hiddenColumns: {columns: hidden, indicators: false,}});
}

export function distanceScatter(clusterSimForm: ClusterSimForm, clusterForm: ClusterForm, modelForm: ModelForm, hot: Handsontable, chart:Chart){
  //as distance changes, the model has to shift up and down
  let distance = parseFloat(clusterSimForm["distance_num"].value);
  let distanceScatter = parseFloat(clusterSimForm["distanceScatter_num"].value);
  //- 5 * Math.log10(dist / 0.01)
}