"use strict";

import Chart from "chart.js/auto";
import zoomPlugin from 'chartjs-plugin-zoom';
import Handsontable from "handsontable";
import {dummyData} from "./chart-gravity-utils/chart-gravity-dummydata";
import { tableCommonOptions, colors } from "./config";
import {
  linkInputs,
  throttle,
  updateLabels,
  updateTableHeight,
} from "./util";
Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart]}:
 */
export function gravity(): [Handsontable, Chart] {
  document
    .getElementById("input-div")
    .insertAdjacentHTML(
      "beforeend",
      '<form title="Gravitational Wave Diagram" id="gravity-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Merger Time (sec):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Merger" name="merge"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Merger" name="merge_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Distance (Mpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="dist"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Distance" name="dist_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Inclination (°):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Inclination" name="inc"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Inclination" name="inc_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Total Mass (solar):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Mass" name="mass"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Mass" name="mass_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Mass Ratio:</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Ratio" name="ratio"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Ratio" name="ratio_num" class="field"></div>\n' +
        "</div>\n" +
        "</form>\n" +
        '<form title="Filters" id="filter-form" style="padding-bottom: .5em">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6" style="color: black;">Remnant Mass:</div>\n' +
        '<div class="col-sm-6" style="color: black;">Mass to Energy:</div>\n' +
        "</div>\n" 
    );
    document.getElementById("extra-options").insertAdjacentHTML("beforeend",
  '<div style="float: right;">\n' +
//   '<label class="scaleSelection" id="standardViewLabel" style="background-color: #4B9CD3;">\n' +
//   '<input type="radio" class="scaleSelection" id="standardView" value="Standard View" checked />&nbsp;Standard View&nbsp;</label>\n' +

    //   '<button class = "graphControl" id="panLeft">◀</button>\n' +
    //   '<button class = "graphControl" id="panRight">▶</button>\n' +
      '<button class = "graphControl" id="panLeft"><center class = "graphControl">&#8592;</center></button>\n' +
      '<button class = "graphControl" id="panRight"><center class = "graphControl">&#8594;</center></button>\n' +
      '<button class = "graphControl" id="zoomIn"><center class = "graphControl">&plus;</center></button>\n' +
      '<button class = "graphControl" id="zoomOut"><center class = "graphControl">&minus;</center></button>\n' +
      '<button class = "graphControlAlt" id="Reset" >Reset</center></button>\n'+
    //   '<button type="button" id="pledge-signed" data-bs-dismiss="modal">Save Graph</button>\n'+
    //   '<button class = "scaleSelection" id="Reset"><center class = "ScaleControl">Reset</center></button>\n' +
    //   '<button class="scaleSelection" id="ResetLabel">\n' +
    //     '<input type="radio" class="scaleSelection" id="Reset" value="Reset" />&nbsp;Reset&nbsp;</label>\n' +
  '</div>\n'
    )

    // let standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
    let Reset = document.getElementById("Reset") as HTMLInputElement;
    // console.log(Reset)
    let panLeft = document.getElementById("panLeft") as HTMLInputElement;
    let panRight = document.getElementById("panRight") as HTMLInputElement;
    let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
    let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;

    
    
    let pan: number;
    panLeft.onmousedown = function() {
        pan = setInterval( () => {myChart.pan(5)}, 20 )
    }
    panLeft.onmouseup = panLeft.onmouseleave = function() {
        clearInterval(pan);
    }
    panRight.onmousedown = function() {
        pan = setInterval( () => {myChart.pan(-5)}, 20 )
      }
    panRight.onmouseup = panRight.onmouseleave = function() {
        clearInterval(pan);
    }

    
    Reset.onclick = function(){
        myChart.options.scales = {
            x: {
                type: 'linear',
                position: 'bottom'
            }
        }
        myChart.update();
    }
    
      //handel zoom/pan buttons
      let zoom: number;
      zoomIn.onmousedown = function () {
        zoom = setInterval(() => { myChart.zoom(1.03) }, 20);;
      }
      zoomIn.onmouseup = zoomIn.onmouseleave = function () {
        clearInterval(zoom);
      }
      zoomOut.onmousedown = function () {
        zoom = setInterval(() => { myChart.zoom(0.97); }, 20);;
      }
      zoomOut.onmouseup = zoomOut.onmouseleave = function () {
        clearInterval(zoom);
      }
  // Link each slider with corresponding text box
  const gravityForm = document.getElementById("gravity-form") as GravityForm;
  const filterForm = document.getElementById("filter-form") as ModelForm;
  linkInputs(gravityForm["merge"], gravityForm["merge_num"], 0, 100, 0.01, 50);
  linkInputs(gravityForm["dist"],gravityForm["dist_num"],10,10000,0.01,300,true,true,10,1000000000000);
  linkInputs(gravityForm["inc"], gravityForm["inc_num"], 0, 90, 0.01, 0);
  linkInputs(gravityForm["mass"],gravityForm["mass_num"],2.5,250,0.01,25,true);
  linkInputs(gravityForm["ratio"],gravityForm["ratio_num"],1,10,0.01,1,true);

  const tableData = dummyData

  // create table
  document.getElementById('axis-label1').style.display = 'inline';
  document.getElementById('axis-label3').style.display = 'inline';
  document.getElementById('xAxisPrompt').innerHTML = "X Axis";
  document.getElementById('yAxisPrompt').innerHTML = "Y Axis";
  const container = document.getElementById("table-div");
  const hot = new Handsontable(
    container,
    Object.assign({}, tableCommonOptions, {
      data: tableData,
      colHeaders: ["Time", "Strain", "Model"], // need to change to filter1, filter2
      columns: [
        {
          data: "Time",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 4 } },
        },
        {
          data: "Strain",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Model",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
      ],
      hiddenColumns: { columns: [2] },
    })
  );
  //now we need to hide the model column
  // create chart
  const ctx = (
    document.getElementById("myChart") as HTMLCanvasElement
  ).getContext("2d");
  const myChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: 'Model',
          data: null,
          borderColor: colors['blue'],
          backgroundColor: colors['blue'],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          hidden: false,
          immutableLabel: true,
        },
        {
          label: 'Data',
          data: [],
          borderColor: colors['red'],
          backgroundColor: colors['red'],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          hidden: false,
          immutableLabel: false,
        },
      ],
    },
    options: {
      hover: {
        mode: "nearest",
      },
      scales: {
        x: {
          //label: 'B-V',
          type: "linear",
          position: "bottom",
        },
        //x2: {
          //type: "linear",
          //position: "bottom",
        //},
        y: {
          //label: 'V',
          reverse: false,
          suggestedMin: 0,
        },
        //y2: {
          //type: "linear",
          //position: "left",
          //reverse: false,
          //suggestedMin: 0,
        //},
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
        },},
    },
  });
  console.log(myChart);
  document.getElementById('chart-div').style.cursor = "move";
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    updateWave(hot, myChart, gravityForm, 1);  
    
  };
console.log(myChart);
  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });
  const fps = 100;
  const frameTime = Math.floor(100 / fps);
  gravityForm.oninput = throttle(
    function () {updateWave(hot,myChart,gravityForm,1)},
    frameTime);
  // link chart to model form (slider + text)

  filterForm.oninput = function () {
    //console.log(tableData);
//leaving this stuff here just in case we need drop down dependencies later
    const reveal: string[] = [
    ];

    const columns: string[] = hot.getColHeader() as string[];
    const hidden: number[] = [];
    for (const col in columns) { //cut off " Mag"
      if (!reveal.includes(columns[col])) {
        //if the column isn't selected in the drop down, hide it
        hidden.push(parseFloat(col));
      }
    }
    hot.updateSettings({
      hiddenColumns: {
        columns: hidden,
        // copyPasteEnabled: false,
        indicators: false,
      },
    });

    update();
    updateLabels(
      myChart,
      document.getElementById("chart-info-form") as ChartInfoForm
    );
    myChart.update("none");
  };
  update();
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
  return [hot, myChart];
}

/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */

//remember later to change the file type to .hdf5

export function gravityFileUpload(
  evt: Event,
  table: Handsontable,
  myChart: Chart<"line">
) 
{
  const file = (evt.target as HTMLInputElement).files[0];

  if (file === undefined) {
    return;
  }

  // File type validation
  if (
    !file.type.match("(text/csv|application/vnd.ms-excel)") &&
    !file.name.match(".*.csv")
  ) {
    alert("Please upload a CSV file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const gravityForm = document.getElementById("gravity-form") as GravityForm;
    // console.log(gravityForm.elements['d'].value);
    gravityForm["dist"].value = Math.log(300).toString();
    // console.log(gravityForm.elements['d'].value);
    gravityForm["mass"].value = Math.log(25).toString();
    gravityForm["ratio"].value = "1";
    gravityForm["merge"].value = "50";
    gravityForm["dist_num"].value = "300";
    gravityForm["mass_num"].value = "25";
    gravityForm["ratio_num"].value = "1";
    gravityForm["merge_num"].value = "50";
    myChart.options.plugins.title.text = "Title";
    myChart.data.datasets[1].label = "Data";
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
  }}
function updateWave(
  table: Handsontable,
  myChart: Chart,
  gravityForm: GravityForm,
  dataSetIndex: 1) 
{
  // let inc = parseFloat(gravityForm["inc_num"].value);
  // let dist = parseFloat(gravityForm["dist_num"].value);
  // let merge = parseFloat(gravityForm["merge_num"].value);
    
  let start = 0;
  let chart = myChart.data.datasets[dataSetIndex].data;
  let tableData = table.getData();
    
    for (let i = 0; i < tableData.length; i++) {
      if (
      tableData[i][0] === null ||
      tableData[i][1] === null ||
      tableData[i][2] === null 
      ) {
      continue;
        }
        //red-blue,lum
    
    let x = (tableData[i][0]);
    let y = (tableData[i][1])
    // let x2 = (tableData[i][0] + merge);
    // let y2 = (tableData[i][2]*(1-((0.5*Math.sin(inc))*(dist/100))));
    chart[start++] = {
      x: x,
     // x2: x2,
      y: y,
     // y2: y2,
        };
//console.log(x);/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//console.log(y);/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//broke chart
  //while (chart.length !== start) {
    //chart.pop();
  }

  myChart.update()
}

 // }
   
/**
 *  This function takes a form to obtain the 4 parameters (a, p, phase, tilt) that determines the
 *  relationship between a moon's angular distance and Julian date, and generates a dataset that
 *  spans over the range determined by the max and min value present in the table.
 *  @param table:   A table used to determine the max and min value for the range
 *  @param form:    A form containing the 4 parameters (amplitude, period, phase, tilt)
 *  @param chart:   The Chartjs object to be updated.
 */
//insert graviational wave function here

/**
 *  This function generates the data used for functions "updateHRModel" and "gravityGenerator."
 *
 *  @param d:            Distance to the Gravity
 *  @param r:            % of the range
 *  @param age:          Age of the Gravity
 *  @param reddening:    The reddening of the observation
 *  @param metallicity:  Metallicity of the gravity
 *  @param start:        The starting point of the data points
 *  @param end:          The end point of the data points
 *  @param steps:        Steps generated to be returned in the array. Default is 500
 *  @returns {Array}
 */

 


    //finding the maximum and minimum of y value for chart scaling
    
  

