"use strict";
import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { colors } from "./config";
import {linkInputs,updateLabels, throttle, chartDataDiff} from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale} from "./chart-cluster-utils/chart-cluster-scatter";
import { insertClusterSimControls} from "./chart-cluster-utils/chart-cluster-interface";
import {defaultTable } from "./chart-cluster-utils/chart-cluster-dummy";
import { HRrainbow } from "./chart-cluster-utils/chart-cluster-util";
import { updateHRModel } from "./chart-cluster-utils/chart-cluster-model";

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
          labels: {
          }
        }
      }
    },
  });
  //add an event listener that removes all datasets and updates addDatasets when the user changes the number of stars
  clusterSimForm.addEventListener("change", () => {
    myChart.data.datasets = [];
    addDatasets(myChart, clusterSimForm);
    updateHRModel(modelForm, hot, [myChart]);
  });
  console.log(myChart.data.datasets[0])
  // update chart whenever the model form changes
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);
  clusterForm.oninput = throttle(
    function () {
      updateHRModel(modelForm, hot, [myChart]);
    },
    frameTime);

  // link chart to model form (slider + text). BOTH datasets are updated because both are affected by the filters.
  modelForm.oninput = throttle(function () {
    updateHRModel(modelForm, hot, [myChart]);
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
  updateHRModel(modelForm, hot, [myChart]);
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