"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import {colors} from "./config";
import {linkInputs, throttle, updateTableHeight,} from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale, updateScatter} from "./chart-cluster-utils/chart-cluster-scatter";
import {
  clusterProButtonControl,
  clusterProButtons,
  clusterProCheckControl,
  clusterProLayoutSetups,
  clusterProSliders, deActivateInterfaceOnFetch,
  insertClusterControls,
  rangeCheckControl,
  setClusterProDefaultLabels,
  updateClusterProLabels
} from "./chart-cluster-utils/chart-cluster-interface";
import {defaultTable} from "./chart-cluster-utils/chart-cluster-dummy";
import {HRrainbow} from "./chart-cluster-utils/chart-cluster-util";
import {updateHRModel} from "./chart-cluster-utils/chart-cluster-model";
import {clusterFileDownload} from "./chart-cluster-utils/chart-cluster-file";
import {
  chart2Scale,
  proFormMinmax,
  updateChart2,
  updateClusterProScatter,
  updateProForm
} from "./chart-cluster-utils/chart-cluster-pro-util";
import {
  queryVizieR, resetScraperForm,
  updateComputeLookupButton, updateScraperParameters
} from "./chart-cluster-utils/chart-cluster-scraper";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart, clusterForm, graphScale]}:
 */
export function cluster3(): [Handsontable, Chart[], ClusterForm, graphScale, ClusterProForm] {
  insertClusterControls(2, true);
  clusterProButtons(true);
  clusterProSliders(true);
  clusterProLayoutSetups();
  resetScraperForm(true, true, false);

  //setup two charts
    document.getElementById('myChart').remove();
    document.getElementById('myChart1').remove();

  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
  linkInputs(clusterForm['err'], clusterForm["err_num"], 0, 1, 0.05, 1, false, true, 0, 999)
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
  linkInputs(clusterForm["distrange"], clusterForm["distrange_num"], 0, 100, 0.01, 30, false, false);
  linkInputs(clusterForm["age"], clusterForm["age_num"], 6.6, 10.2, 0.01, 6.6);
  linkInputs(clusterForm["bv"], clusterForm["red_num"], 0, 1, 0.01, 0, false, true, 0, 100000000);
  linkInputs(clusterForm["rv"], clusterForm["rv_num"], 0, 6, 0.01, 3.1, false, true, 0, 100000000);
  linkInputs(clusterForm["metal"], clusterForm["metal_num"], -2.2, 0.7, 0.01, -2.2);
  
  //when table data changes, change the maxes and mins of the sliders and number boxes
  //linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], 0, 100, 0.01, 50, false, false);
  //linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, 100, 0.01, 100, false, false);
  //linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], 0, 100, 0.01, 50, false, false);
  //linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, 100, 0.01, 100, false, false);

  rangeCheckControl(true);
  clusterProCheckControl();

  //add invisible box under the x axis of the charts to shift the buttons down
  //document.getElementById('chart-div1').style.marginBottom = "10px";
  //document.getElementById('chart-div2').style.marginBottom = "10px";
  document.getElementById('chart-div3').style.marginBottom = "8px";
  document.getElementById('chart-div4').style.marginBottom = "8px";

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
  const ctx1 = (document.getElementById("myChart3") as HTMLCanvasElement).getContext('2d');

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
          data: [{ x: 0, y: 0 }],
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
      aspectRatio: 1.1175,
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
            top: -3,
            bottom: 14,
          }
        },
        legend: {
          display: false,
          align: "end",
          labels: {
            filter: function(item) {
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
  //make a function that disables the distrange slider if the distrangeCheckbox is not checked

  const ctx2 = (document.getElementById("myChart4") as HTMLCanvasElement).getContext('2d');

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
          data: [{ x: 0, y: 0 }],
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
      aspectRatio: 1.1175,
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
            size: 1},
          padding: {
            top: 9,
            bottom: -10,
          }
        },
        legend: {
          align: "end",
          labels: {
            filter: function(item) {
              // Logic to remove a particular legend item goes here
              return !item.text.includes('Model2');
            }
          }
        }
      }
    },
  });

  const ctx3 = (document.getElementById("myChart2") as HTMLCanvasElement).getContext('2d');

  const myChart3 = new Chart(ctx3, {
    type: "line",
    data: {
      labels: ["Data"],
      datasets: [
        {
          type: "line",
          label: "raMotion",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["black"],
          borderColor: colors["black"],
          borderWidth: 1,
          fill: false,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "decMotion",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["black"],
          borderColor: colors["black"],
          borderWidth: 1,
          fill: false,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "scatter",
          label: "properMotionRaDec",
          data: [{ x: 0, y: 0 }],
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
        {
          type: "line",
          label: "rarangeleft",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 6,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "rarangeright",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 5,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "decrangetop",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 'start',
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "decrangebottom",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 'end',
          showLine: true,
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
      aspectRatio: 1.43,
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
          reverse: false,
          suggestedMin: 0,
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            // mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            // mode: 'x',
          },
        },
        title: {
          display: false
          },
        legend: {
          display: false,

        },
      }
      }
    },
  ) as Chart;

  //pull the proper motion ra and dec values from the table
  //change the default font size of myChart2
  //create graph control buttons and assign onZoom onPan functions to deactivate radio button selections
  let graphControl = new ChartScaleControl([myChart1, myChart2], clusterForm, graphMinMax);
  myChart1.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(clusterForm)};
  myChart1.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(clusterForm)};
  myChart2.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(clusterForm, 1)};
  myChart2.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(clusterForm, 1)};
  let frameChart1 = ()=>{document.getElementById('frameChart1').click()};
  let frameChart2 = ()=>{document.getElementById('frameChart2').click()};
  document.getElementById('chart-div3').onmousedown = frameChart1;
  document.getElementById('chart-div4').onmousedown = frameChart2;
  let minmax = proFormMinmax(hot, clusterForm)
  //myChart3.update();
  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
        clusterForm["red"].value, clusterForm["blue"].value);
      myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
            clusterForm["red2"].value, clusterForm["blue2"].value);
      myChart1.update();
      myChart3.update();
      myChart2.update();
      updateTableHeight(hot);
    }, 10)
  }
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, -1, clusterProForm);
    updateClusterProScatter(hot, myChart3, clusterForm)
  };
  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);

  //clusterProPmChartControl.onclick = throttle(() => {
      //clusterProButtonControl(myChart3, minmax);
      //},
    //frameTime);
    clusterProButtonControl(myChart3, hot, clusterForm);
  // clusterForm.oninput = throttle(
  //   function () {
  //     updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, -1, clusterProForm);
  //     updateClusterProScatter(hot, myChart3, clusterForm)
  //     },
  //   frameTime);

  //update the graph continuoustly when the values in the form change
  clusterProForm.oninput = throttle( ()=>{
    updateChart2(myChart3, clusterProForm, minmax)
    updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, -1, clusterProForm);
  }, frameTime)

  // link chart to model form (slider + text)
  // clusterForm.oninput=
  clusterForm.oninput = throttle(function () {
      updateHRModel(clusterForm, hot, [myChart1, myChart2], (chartNum: number) => {
        updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, chartNum, clusterProForm);
        updateClusterProScatter(hot, myChart3, clusterForm);
        updateClusterProLabels([myChart1, myChart2]);
    });
   }, 100);

  document.getElementById('save-data-button').onclick = ()=>{clusterFileDownload(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, -1, clusterProForm)}

  document.getElementById('discardData').onclick = ()=>{
    updateScatter(hot, [myChart1, myChart2], clusterForm, [2, 2], graphMinMax, -1, clusterProForm, true);
    // clusterProCheckControl();
    updateClusterProScatter(hot, myChart3, clusterForm);
    const proMinMax = proFormMinmax(hot, clusterForm);
    // updateProForm(proMinMax, clusterProForm);
    updateChart2(myChart3, clusterProForm, proMinMax);
    chart2Scale(myChart3, proMinMax);
    myChart3.update();
  }

  document.getElementById('computeCenter').onclick = ()=>{
    updateScraperParameters(hot);
  }

  document.getElementById('cluster-scraper').oninput = ()=>{
    updateComputeLookupButton();
  }

  document.getElementById('fetchData').onclick = ()=>{

    queryVizieR(hot, [myChart1, myChart2], graphMinMax, myChart3);
  }


  //initializing website
  update();
  updateHRModel(clusterForm, hot, [myChart1, myChart2]);
  document.getElementById("extra-options").style.display = "block";
  document.getElementById("standardView").click();
  myChart3.options.scales["x"].title.text = "Motion in RA (mas/yr)";
  myChart3.options.scales["y"].title.text = "Motion in Dec (mas/yr)";
  myChart1.options.plugins.title.text = "Title";
  myChart1.options.scales["x"].title.text = "x1";
  myChart1.options.scales["y"].title.text = "y1";
  myChart2.options.scales["x"].title.text = "x2";
  myChart2.options.scales["y"].title.text = "y2";
  updateProForm(minmax, clusterProForm)
  updateClusterProScatter(hot, myChart3, clusterForm)
  chart2Scale(myChart3, minmax)
  updateChart2(myChart3, clusterProForm, minmax)
  // let chartInfoForm = document.getElementById("chart-info-form") as ChartInfoForm;
  // updateLabels(myChart1, chartInfoForm, false, false, false, false, 0);
  // updateLabels(myChart2, chartInfoForm, false, false, false, false, 1);
  setClusterProDefaultLabels([myChart1, myChart2])
  const chartTypeForm = document.getElementById('chart-type-form') as HTMLFormElement;
  document.getElementById('rarangeCheck').click()
  document.getElementById('rarangeCheck').click()
  chartTypeForm.addEventListener("change" , function () {
    //destroy the chart
    //testing a bunch of creating charts and destroying them to make the thing work
    myChart3.destroy();
    myChart1.destroy();
    myChart2.destroy();
  });
  //console log tabledata
  //console.log(minmax[8]);
  //console.log(minmax[4]);
  return [hot, [myChart1, myChart2, myChart3], clusterForm, graphMinMax, clusterProForm];
  
}

