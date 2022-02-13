"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { ScatterDataPoint } from "chart.js";
import {
  calculateLambda,
  dummyData,
  filterMags,
  filterWavelength,
  HRModelRounding,
  HRrainbow,
  httpGetAsync,
  pointMinMax
} from "./chart-cluster-util";
import { colors, tableCommonOptions } from "./config";
import { changeOptions, linkInputs, throttle, updateLabels, updateTableHeight, } from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import { median } from "./my-math";
// import { rad } from "./my-math";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart]}:
 */
export function cluster1(): [Handsontable, Chart, ModelForm] {
  document
    .getElementById("input-div")
    .insertAdjacentHTML(
      "beforeend",
      '<form title="Cluster Diagram" id="cluster-form">\n' +
      '<div class="row">\n' +
      '<div class="col-sm-6 des">Max Error (mag):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Error" name="err"></div>\n' +
      '<div class="col-sm-2 text"><input type="number" title="Error" name="err_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-6 des">Distance (kpc):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
      '<div class="col-sm-2 text"><input type="number" title="Distance" name="d_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-6 des">Extinction in V (mag):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Reddening" name="red"></div>\n' +
      '<div class="col-sm-2 text"><input type="number" title="Reddening" name="red_num" class="field"></div>\n' +
      "</div>\n" +
      "</form>\n" +
      '<form title="Filters" id="model-form" style="padding-bottom: .5em">\n' +
      '<div class="row">\n' +
      '<div class="col-sm-6 des">log(Age (yr)):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Age" name="age"></div>\n' +
      '<div class="col-sm-2 text"><input type="number" title="Age" name="age_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-6 des">Metallicity (solar):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
      '<div class="col-sm-2 text"><input type="number" title="Metallicity" name="metal_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-6" style="color: grey;">Select Filters:</div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-4">Blue:</div>\n' +
      '<div class="col-sm-4">Red:</div>\n' +
      '<div class="col-sm-4">Luminosity:</div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-4"><select name="blue" style="width: 100%;" title="Select Blue Color Filter">\n' +
      '<option value="B" title="B filter" selected>B</option></div>\n' +
      '<option value="V" title="V filter">V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter">I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="red" style="width: 100%;" title="Red Color Filter">\n' +
      '<option value="B" title="B filter">B</option></div>\n' +
      '<option value="V" title="V filter" selected>V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter">I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="lum" style="width: 100%;" title="Select Luminosity Filter">\n' +
      '<option value="B" title="B filter">B</option></div>\n' +
      '<option value="V" title="V filter" selected>V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter" >I</option></select></div>\n' +
      "</div>\n" +
      "</form>\n"
    );
  //make graph scaling options visible to users
  document.getElementById("extra-options").insertAdjacentHTML("beforeend",
    '<div class = "extra">\n' +
    '<label class="scaleSelection" id="standardViewLabel">\n' +
    '<input type="radio" class="scaleSelection" id="standardView" value="Standard View" checked />' +
      '<div class="radioText">Standard View</div>' +
      '</label>\n' + '&nbsp;' +
    '<label class="scaleSelection" id="frameOnDataLabel">\n' +
    '<input type="radio" class="scaleSelection" id="frameOnData" value="Frame on Data" />'+
      '<div class="radioText">Frame on Data</div>' +
      '</label>\n' + '&nbsp;' +
    '<button class = "graphControl" id="panLeft"><center class = "graphControl">&#8592;</center></button>\n' +
      '&nbsp;' +
    '<button class = "graphControl" id="panRight"><center class = "graphControl">&#8594;</center></button>\n' +
      '&nbsp;' +
    '<button class = "graphControl" id="zoomIn"><center class = "graphControl">&plus;</center></button>\n' +
      '&nbsp;' +
    '<button class = "graphControl" id="zoomOut"><center class = "graphControl">&minus;</center></button>\n' +
    '<div style="padding: 0 6px 0 6px"></div>' +
    '</div>\n'
  )

  //Declare UX forms. Seperate based on local and server side forms.
  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const modelForm = document.getElementById("model-form") as ModelForm;

  // Link each slider with corresponding text box
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
  linkInputs(clusterForm["err"], clusterForm["err_num"], 0, 1, 0.01, 1, false, true, 0, 100000000);
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.3, 0.01, 6.6);
  linkInputs(
    clusterForm["red"], clusterForm["red_num"],
    0,
    3,
    0.01,
    0,
    false,
    true,
    0,
    100000000
  );
  linkInputs(modelForm["metal"], modelForm["metal_num"],
    -3.4,
    0.2,
    0.01,
    -3.4
  );

  const tableData = dummyData;

  //handel scaling options input
  let standardViewLabel = document.getElementById("standardViewLabel") as HTMLLabelElement;
  let frameOnDataLabel = document.getElementById("frameOnDataLabel") as HTMLLabelElement;
  let standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
  let frameOnDataRadio = document.getElementById("frameOnData") as HTMLInputElement;
  let panLeft = document.getElementById("panLeft") as HTMLInputElement;
  let panRight = document.getElementById("panRight") as HTMLInputElement;
  let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
  let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;
  standardViewRadio.addEventListener("click", () => {
    radioOnclick(standardViewRadio, frameOnDataRadio);
  });
  frameOnDataRadio.addEventListener("click", () => {
    radioOnclick(frameOnDataRadio, standardViewRadio)
  });
  standardViewLabel.onmouseover = ()=>{ labelOnHover(standardViewLabel)}
  standardViewLabel.onmouseleave = ()=>{ labelOffHover(standardViewLabel)}
  frameOnDataLabel.onmouseover = ()=>{ labelOnHover(frameOnDataLabel)}
  frameOnDataLabel.onmouseleave = ()=>{labelOffHover(frameOnDataLabel)}

  let pan: number;
  panLeft.onmousedown = function() {
    pan = setInterval( () => {myChart.pan(-5)}, 20 )
  }
  panLeft.onmouseup = panLeft.onmouseleave = function () {
    clearInterval(pan);
  }
  panRight.onmousedown = function() {
    pan = setInterval( () => {myChart.pan(5)}, 20 )
  }
  panRight.onmouseup = panRight.onmouseleave = function () {
    clearInterval(pan);
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

  //only one option can be selected at one time. 
  //The selected option is highlighted by making the background Carolina blue
  function radioOnclick(radioOnClicked: HTMLInputElement, otherRadio: HTMLInputElement): any {
    radioOnClicked.checked = true;
    setRadioLabelColor(radioOnClicked, true)
    otherRadio.checked = false;
    setRadioLabelColor(otherRadio, false)

    graphScaleMode = radioOnClicked.id === "standardView" ? "auto" : "data"
    chartRescale(myChart, modelForm)
  }


  //Alter radio input background color between Carolina blue and white
  function setRadioLabelColor(radio: HTMLInputElement, activate: boolean) {
    let radioLabel: HTMLLabelElement = document.getElementById(radio.id + "Label") as HTMLLabelElement
    radioLabel.style.backgroundColor = activate ? "#4B9CD3" : "white";
    radioLabel.style.opacity = activate ? "1" : "0.7";
  }

  function labelOnHover(label: HTMLLabelElement) {
    if (label.style.backgroundColor === "white" || label.style.backgroundColor === "#FFFFFF") {
      label.style.backgroundColor = "#E7E7E7";
    }
    label.style.opacity = "1";
  }

  function labelOffHover(label: HTMLLabelElement) {
    if (label.style.backgroundColor === "rgb(231, 231, 231)") {
      label.style.backgroundColor = "white";
      label.style.opacity = "0.7";
    }

  }

  //Unchecked and reset both radio buttons to white background
  function zoompanDeactivate(): any {
    graphScaleMode = null
    standardViewRadio.checked = false;
    frameOnDataRadio.checked = false;
    setRadioLabelColor(standardViewRadio, false)
    setRadioLabelColor(frameOnDataRadio, false)
    setTimeout(function () {
      myChart.data.datasets[2].backgroundColor = HRrainbow(myChart,
        modelForm["red"].value, modelForm["blue"].value)
      myChart.update()
    }, 5)
  }

  // create table
  const container = document.getElementById("table-div");
  const hot = new Handsontable(
    container,
    Object.assign({}, tableCommonOptions, {
      data: tableData,
      colHeaders: ["B Mag", "Berr", "V Mag", "Verr", "R Mag", "Rerr", "I Mag", "Ierr"], // need to change to filter1, filter2
      columns: [
        { data: "B", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "Berr", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "V", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "Verr", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "R", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "Rerr", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "I", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
        { data: "Ierr", type: "numeric", numericFormat: { pattern: { mantissa: 2 } }, },
      ],
      hiddenColumns: { columns: [1, 3, 4, 5, 6, 7] },
    })
  );

  // create chart
  const canvas = document.getElementById("myChart") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  const myChart = new Chart(ctx, {
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
            onPan: () => { zoompanDeactivate() },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
            onZoom: () => { zoompanDeactivate() },
          },
        },
        // legend: {
        //   onClick: newLegendClickHandler,
        // }
        legend: {
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


  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart.data.datasets[2].backgroundColor = HRrainbow(myChart,
        modelForm["red"].value, modelForm["blue"].value)
      myChart.update()
    }, 10)
  }

  //update table height and scatter plotting
  const update = function () {
    updateTableHeight(hot);
    updateScatter(hot, myChart, clusterForm, modelForm, 2);
  };

  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });

  //update scatter plotting when clusterFrom being updated by user
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);
  clusterForm.oninput = throttle(
    function () { updateScatter(hot, myChart, clusterForm, modelForm, 2) },
    frameTime);

  // link chart to model form (slider + text). BOTH datasets are updated because both are affected by the filters.
  modelForm.oninput = throttle(function () {
    updateHRModel(modelForm, myChart, hot, () => {
      // console.log("Update Scatter")
      updateScatter(hot, myChart, clusterForm, modelForm, 2)
    });
  }, 100);


  //initializing website
  update();
  updateHRModel(modelForm, myChart, hot);
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

  return [hot, myChart, modelForm];
}

/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart The chart to be plotted
 */
export function clusterFileUpload(
  evt: Event,
  table: Handsontable,
  myChart: Chart<"line">,
) {
  // console.log("clusterFileUpload called");
  const file = (evt.target as HTMLInputElement).files[0];

  if (file === undefined) {
    return;
  }

  // File type validation
  if (
    !file.type.match("(text/csv|application/vnd.ms-excel)") &&
    !file.name.match(".*.csv")
  ) {
    console.log("Uploaded file type is: ", file.type);
    console.log("Uploaded file name is: ", file.name);
    alert("Please upload a CSV file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const modelForm = document.getElementById("model-form") as ModelForm;
    // console.log(clusterForm.elements['d'].value);
    clusterForm["d"].value = Math.log(3).toString();
    clusterForm["err"].value = "1";
    // console.log(clusterForm.elements['d'].value);
    clusterForm["err"].value = "1";
    clusterForm["err_num"].value = "1";
    modelForm["age"].value = "6.6";
    clusterForm["red"].value = "0";
    modelForm["metal"].value = "-3.4";
    clusterForm["err_num"].value = "1";
    clusterForm["d_num"].value = "3";
    modelForm["age_num"].value = "6.6";
    clusterForm["red_num"].value = "0";
    modelForm["metal_num"].value = "-3.4";
    myChart.options.plugins.title.text = "Title";
    myChart.data.datasets[2].label = "Data";
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
    const data: string[] = (reader.result as string)
      .split("\n")
      .filter((str) => str !== null && str !== undefined && str !== "");
    const datadict = new Map<string, Map<string, number>>(); // initializes a dictionary for the data
    let filters: string[] = [];
    data.splice(0, 1);
    //fills the dictionary datadict with objects for each source, having attributes of each filter magnitude
    for (const row of data) {
      let items = row.trim().split(",");
      let src = items[1];
      let filter = items[10] === "K" ? "Ks" : items[10];//interpret K as Ks
      let mag = parseFloat((items.length >= 24 && items[23] != '') ? items[23] : items[12]);//if no calibrated mag, return mag
      // let mag = parseFloat(items[12]);
      let err = parseFloat(items[13]);
      if (!datadict.has(src)) {
        datadict.set(src, new Map<string, number>());
      }
      if (items[12] !== "") {
        datadict.get(src).set(filter, isNaN(mag) ? null : mag);
        datadict.get(src).set(filter + "err", isNaN(err) ? 0 : err);
        if (!filters.includes(filter)) {
          filters.push(filter);
        }
      }
    }
    //add null values for sources that didn't show up under each filter
    for (const src of datadict.keys()) {
      for (const f of filters) {
        if (!datadict.get(src).has(f)) {
          datadict.get(src).set(f, null);
          datadict.get(src).set(f + "err", null);
        }
      }
    }

    const blue = modelForm["blue"];
    const red = modelForm["red"];
    const lum = modelForm["lum"];

    //Change filter options to match file

    //order filters by temperature
    const knownFilters = [
      "U",
      "uprime",
      "B",
      "gprime",
      "V",
      "vprime",
      "rprime",
      "R",
      "iprime",
      "I",
      "zprime",
      "Y",
      "J",
      "H",
      "Ks",
      "K",
    ];
    //knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters, leaving the filters in the file in order.
    filters = knownFilters.filter((f) => filters.indexOf(f) >= 0);
    //if it ain't known ignore it

    const optionList = [];
    const headers: any[] = [];
    const columns: any[] = [];
    let hiddenColumns: any[] = [];
    for (let i = 0; i < filters.length; i++) {
      //makes a list of options for each filter
      optionList.push({
        value: filters[i],
        title: filters[i] + " Mag",
        text: filters[i],
      });
      hiddenColumns[i] = i;
      hiddenColumns[i + filters.length] = i + filters.length; //we have to double up the length for the error data
      headers.push(filters[i] + " Mag"); //every other column is err
      headers.push(filters[i] + "err");
      columns.push({
        data: filters[i],
        type: "numeric",
        numericFormat: { pattern: { mantissa: 2 } },
      });
      columns.push({
        data: filters[i] + "err",
        type: "numeric",
        numericFormat: { pattern: { mantissa: 2 } },
      });
    }
    hiddenColumns = hiddenColumns.filter((c) => [0, 2].indexOf(c) < 0); //get rid of the columns we want revealed
    //Change the options in the drop downs to the file's filters
    //blue and lum are most blue by default, red is set to most red
    changeOptions(blue, optionList);
    changeOptions(red, optionList);
    //red.value = red.options[red.options.length-1].value;
    changeOptions(lum, optionList);

    blue.value = filters[0];
    red.value = filters[1];
    lum.value = filters[1];

    //convrt datadict from dictionary to nested number array tableData
    const tableData: { [key: string]: number }[] = [];
    datadict.forEach((src) => {
      const row: { [key: string]: number } = {};
      for (let filterIndex in filters) {
        row[filters[filterIndex]] = src.get(filters[filterIndex]);
        row[filters[filterIndex] + "err"] = src.get(
          filters[filterIndex] + "err"
        );
      }
      tableData.push(row);
    });


    updateHRModel(modelForm, myChart, table,
      () => {
        table.updateSettings({
          data: tableData,
          colHeaders: headers,
          columns: columns,
          hiddenColumns: { columns: hiddenColumns },
        }); //hide all but the first 3 columns
        updateTableHeight(table);
        updateScatter(table, myChart, clusterForm, modelForm, 2);
        document.getElementById("standardView").click();
      });
  };
  reader.readAsText(file);
  // chartRescale(myChart, modelForm, "auto")

}


let graphScaleMode = "auto";
let graphScale: { [key: string]: number }[] = [
  { minX: NaN, maxX: NaN, minY: NaN, maxY: NaN, },
  { minX: NaN, maxX: NaN, minY: NaN, maxY: NaN, },
]
/**
 *  This function takes a form to obtain the 5 parameters (age, metallicity, red, blue, and lum filter)
 *  request HR diagram model from server and plot on the graph.
 *  @param table:   A table used to determine the max and min value for the range
 *  @param form:    A form containing the 5 parameters (age, metallicity, red, blue, and lum filter) 
 *  @param chart:   The Chartjs object to be updated.
 */
function updateHRModel(modelForm: ModelForm, chart: Chart, hot: Handsontable, callback: Function = () => { }) {
  let url = "http://localhost:5000/isochrone?"
  // let url = "http://152.2.18.8:8080/isochrone?"
  // let url = "https://skynet.unc.edu/graph-api/isochrone?"
    + "age=" + HRModelRounding(modelForm['age_num'].value)
    + "&metallicity=" + HRModelRounding(modelForm['metal_num'].value)
    + "&filters=[%22" + modelForm['blue'].value
    + "%22,%22" + modelForm['red'].value
    + "%22,%22" + modelForm['lum'].value + "%22]"

  function modelFilter(dataArray: number[][]): [ScatterDataPoint[], ScatterDataPoint[], { [key: string]: number }] {
    let form: ScatterDataPoint[] = [] //the array containing all model points
    let scaleLimits: { [key: string]: number } = { minX: NaN, minY: NaN, maxX: NaN, maxY: NaN, };
    let deltas: number[] = [NaN];
    let deltaXs: number [] =[NaN];
    let deltaYs: number [] = [NaN];
    let iBeg: number = 0;
    let iEnd: number = 0;
    let begN: number = 1;
    let endN: number = 1;
    let maxDeltaIndex: number = 0;
    for (let i = 0; i < dataArray.length; i++) {
      let x_i: number = dataArray[i][0];
      let y_i: number = dataArray[i][1];
      let row: ScatterDataPoint = { x: x_i, y: y_i };
      scaleLimits = pointMinMax(scaleLimits, dataArray[i][0], dataArray[i][1]);
      form.push(row);
      if (i > 0) {
        let deltaX: number = Math.abs(x_i - dataArray[i - 1][0]);
        let deltaY: number = Math.abs(y_i - dataArray[i - 1][1]);
        deltaXs.push(deltaX);
        deltaYs.push(deltaY);
      }
    }
    deltaXs.shift();
    deltaYs.shift();
    let xMedianValue: number = median(deltaXs);
    let yMedianValue: number = median(deltaYs);
    form.pop();
    //From the beginning of delta_i, find the nth = 1st i such that delta_i < sqrt(2).
    // Call it iBeg. KEEP all points before iBeg.
    for (let i = 0; i < deltaXs.length; i++) {
      let delta = ((deltaXs[i] / xMedianValue) ** 2 + (deltaYs[i] / yMedianValue) ** 2) ** 0.5
      if (delta < (2 ** 0.5) && begN > 0) {
        begN --;
        iBeg = i;
      }
      deltas.push(delta);
    }
    //From the end of delta_i, find the nth = 1st i such that delta_i < sqrt(2).
    // Call it iEnd. REMOVE all points after iEnd.
    deltas.shift();
    for (let i = deltas.length; i >= 0; i--) {
      if (deltas[i] < (2 ** 0.5) && endN > 0) {
        endN --;
        iEnd = i;
      }
      if (endN == 0) {
        break;
      }
    }
    maxDeltaIndex = deltas.indexOf(Math.max.apply(null, deltas.slice(iBeg, iEnd))) + 1;
    return [form.slice(0, maxDeltaIndex), form.slice(maxDeltaIndex,iEnd), scaleLimits]
  }
  let requestFailed = true;
  httpGetAsync(url, (response: string) => {
    let dataTable: number[][] = JSON.parse(response);
    chart.data.datasets[0].data = modelFilter(dataTable)[0];
    chart.data.datasets[1].data = modelFilter(dataTable)[1];
    chart.update("none");
    callback(); //needs to be asyncronous
    if (graphScaleMode === "model") {
      graphScale[0] = modelFilter(dataTable)[2];
      chartRescale(chart, modelForm);
    }
    requestFailed = false;
  });
  if(requestFailed)
    callback();//We need this to run anyways if the request fails

  const reveal: string[] = [
    modelForm["red"].value,
    modelForm["blue"].value,
    modelForm["lum"].value,
  ];

  let columns: string[] = hot.getColHeader() as string[];
  let hidden: number[] = [];
  for (const col in columns) {
    columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
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
}


function updateScatter(
  table: Handsontable,
  myChart: Chart,
  clusterForm: ClusterForm,
  modelForm: ModelForm,
  dataSetIndex: number,
) {
  let err = parseFloat(clusterForm["err_num"].value);
  let dist = parseFloat(clusterForm["d_num"].value);
  let reddening = parseFloat(clusterForm["red_num"].value);

  let chart = myChart.data.datasets[dataSetIndex].data;
  let tableData = table.getData();
  let columns = table.getColHeader();

  //Identify the column the selected filter refers to
  let blue = columns.indexOf(modelForm["blue"].value + " Mag");
  let red = columns.indexOf(modelForm["red"].value + " Mag");
  let lum = columns.indexOf(modelForm["lum"].value + " Mag");

  let A_v1 = calculateLambda(
    reddening,
    filterWavelength[modelForm["blue"].value]
  );
  let A_v2 = calculateLambda(
    reddening,
    filterWavelength[modelForm["red"].value]
  );
  let A_v3 = calculateLambda(
    reddening,
    filterWavelength[modelForm["lum"].value]
  );

  let blueErr =
    columns.indexOf(modelForm["blue"].value + "err") < 0
      ? null
      : columns.indexOf(modelForm["blue"].value + "err"); //checks for supplied err data
  let redErr =
    columns.indexOf(modelForm["red"].value + "err") < 0
      ? null
      : columns.indexOf(modelForm["red"].value + "err");
  let lumErr =
    columns.indexOf(modelForm["lum"].value + "err") < 0
      ? null
      : columns.indexOf(modelForm["lum"].value + "err");

  let scaleLimits: { [key: string]: number } = { minX: NaN, minY: NaN, maxX: NaN, maxY: NaN, };


  let start = 0;
  for (let i = 0; i < tableData.length; i++) {
    if (
      typeof (tableData[i][blue]) != 'number' ||
      typeof (tableData[i][red]) != 'number' ||
      typeof (tableData[i][lum]) != 'number' ||
      (blueErr != null && tableData[i][blueErr] >= err) ||
      (redErr != null && tableData[i][redErr] >= err) ||
      (lumErr != null && tableData[i][lumErr] >= err)
    ) {
      continue;
    }
    //red-blue,lum

    let x = tableData[i][blue] - A_v1 - (tableData[i][red] - A_v2);
    let y = tableData[i][lum] - A_v3 - 5 * Math.log10(dist / 0.01);
    chart[start++] = {
      x: x,
      y: y
    };
    scaleLimits = pointMinMax(scaleLimits, x, y);
  }
  while (chart.length !== start) {
    chart.pop();
  }
  if (graphScaleMode !== null) {
    graphScale[1] = scaleLimits;
    chartRescale(myChart, modelForm);
  }
  else{
    myChart.data.datasets[dataSetIndex].backgroundColor = HRrainbow(myChart, //we need to do this anyways if the chart isn't rescaled
      modelForm["red"].value, modelForm["blue"].value)
      // console.log("YYYYYYYYYYYYYYYYYYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYYYYYYYYYYYYYYYY")
  }

  myChart.update()
}

// rescale scatter to contain all the data points
export function chartRescale(myChart: Chart, modelForm: ModelForm, option: string = null) {
  let adjustScale: { [key: string]: number } = { minX: 0, minY: 0, maxX: 0, maxY: 0, };
  let xBuffer: number = 0;
  let yBuffer: number = 0;
  for (let key in adjustScale) {
    let frameOn: string = option === null ? graphScaleMode : (graphScaleMode = option);
    let frameParam: { [key: string]: number[] } = { 'model': [0, 0], 'data': [1, 1], 'both': [0, 1], 'auto': [NaN] }

    if (isNaN(frameParam[frameOn][0])) {
      let magList: string[] = ['red', 'blue', 'bright'];
      let filters: string[] = [modelForm['red'].value, modelForm['blue'].value, modelForm['lum'].value];
      let x: { [key: string]: number } = { 'red': 0, 'blue': 0, 'bright': 0 }
      let magIndex: number[] = [0, 0, 0];
      for (let i = 0; i < magList.length; i++) {
        x[magList[i]] = Math.log(filterWavelength[filters[i]] * 1000) / Math.log(10);
        if ("UBVRI".includes(filters[i])) {
          magIndex[i] = Number(0);
        } else if ("uprimegprimerprimeiprimezprime".includes(filters[i])) {
          magIndex[i] = Number(1);
        } else if ("JHKs".includes(filters[i])) {
          magIndex[i] = Number(2);
        }
      }

      let mags: { [key: string]: Function[] } = filterMags()

      let color_red: number = mags['red'][magIndex[1]](x['blue']) - mags['red'][magIndex[0]](x['red']);
      let color_blue: number = mags['blue'][magIndex[1]](x['blue']) - mags['blue'][magIndex[0]](x['red']);

      adjustScale = {
        'minX': color_blue - (color_red - color_blue) / 8,
        'maxX': color_red + (color_red - color_blue) / 8,
        'minY': mags['bright'][magIndex[2]](x['bright']) + (mags['bright'][magIndex[2]](x['bright']) - mags['faint'][magIndex[0]](x['bright'])) / 8,
        'maxY': mags['faint'][magIndex[0]](x['bright']) - (mags['bright'][magIndex[2]](x['bright']) - mags['faint'][magIndex[0]](x['bright'])) / 8
      };

    } else {
      if (key.includes('min')) {
        adjustScale[key] = Math.min(graphScale[frameParam[frameOn][0]][key],
          graphScale[frameParam[frameOn][1]][key])
      } else {
        adjustScale[key] = Math.max(graphScale[frameParam[frameOn][0]][key],
          graphScale[frameParam[frameOn][1]][key])
      }
      xBuffer = (adjustScale["maxX"] - adjustScale["minX"]) * 0.2;
      yBuffer = (adjustScale["maxY"] - adjustScale["minY"]) * 0.2;
      let minbuffer = 0.1;
      let maxbuffer = 1;
      xBuffer = (xBuffer > minbuffer ? (xBuffer < maxbuffer ? xBuffer : maxbuffer) : minbuffer)
      yBuffer = (yBuffer > minbuffer ? (yBuffer < maxbuffer ? yBuffer : maxbuffer) : minbuffer)
    }
    if (isNaN(adjustScale[key])) {
    }
    adjustScale[key] = isNaN(adjustScale[key]) ? 0 : adjustScale[key]
  }

  myChart.options.scales["y"].min = adjustScale["minY"] - yBuffer
  myChart.options.scales["y"].max = adjustScale["maxY"] + yBuffer
  myChart.options.scales["y"].reverse = true
  //myChart.options.scales["y"].suggestedMin = 0

  myChart.options.scales["x"].min = adjustScale["minX"] - xBuffer
  myChart.options.scales["x"].max = adjustScale["maxX"] + xBuffer
  myChart.options.scales["x"].type = "linear"
  //myChart.options.scales["x"].position = "bottom"
  //what is ^this^ for?

  myChart.data.datasets[2].backgroundColor = HRrainbow(myChart,
    modelForm["red"].value, modelForm["blue"].value)
  myChart.update()
}