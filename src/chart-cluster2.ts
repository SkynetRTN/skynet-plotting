"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import {
  dummyData,
  graphScale,
  HRrainbow,
} from "./chart-cluster-util";
import { colors, tableCommonOptions } from "./config";
import { changeOptions, linkInputs, throttle, updateLabels, updateTableHeight, } from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {chartRescale, insertClusterControls, insertGraphControl, updateHRModel, updateScatter } from "./chart-cluster";
// import { rad } from "./my-math";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart, modelForm, graphScale]}:
 */
export function cluster2(): [Handsontable, Chart, Chart, ModelForm, graphScale] {
    insertClusterControls(2);
    //make graph scaling options visible to users
    //document.getElementById("extra-options").style.display = "inline"
    insertGraphControl();
    //setup two charts
    document.getElementById('myChart').remove();
    document.getElementById('chart-div1').style.display = 'inline';
    document.getElementById('chart-div2').style.display = 'inline';
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label2').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('axis-label4').style.display = 'inline';

  // Link each slider with corresponding text box
  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const modelForm = document.getElementById("model-form") as ModelForm;
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
  linkInputs(clusterForm["err"], clusterForm["err_num"], 0, 1, 0.01, 1, false, true, 0, 100000000);
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.3, 0.01, 6.6);
  linkInputs(clusterForm["red"], clusterForm["red_num"], 0, 3, 0.01, 0, false, true, 0, 100000000);
  linkInputs(modelForm["metal"], modelForm["metal_num"], -3.4, 0.2, 0.01, -3.4);

  const tableData = dummyData;

  //declare graphScale limits
  let graphMinMax = new graphScale(2);

  //handel scaling options input
  let standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
  let frameOnDataRadio = document.getElementById("frameOnData") as HTMLInputElement;
  let panLeft = document.getElementById("panLeft") as HTMLInputElement;
  let panLeft2 = document.getElementById("panLeft") as HTMLInputElement;
  let panRight = document.getElementById("panRight") as HTMLInputElement;
  let panRight2 = document.getElementById("panRight") as HTMLInputElement;
  let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
  let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;
  standardViewRadio.addEventListener("click", () => {
    radioOnclick(standardViewRadio, frameOnDataRadio, graphMinMax);
  });
  frameOnDataRadio.addEventListener("click", () => {
    radioOnclick(frameOnDataRadio, standardViewRadio, graphMinMax)
  });
   let pan: number;
    let pan2: number;
   panLeft.onmousedown = function() {
     pan = setInterval( () => {myChart1.pan(5)}, 20 );
     pan2 = setInterval( () => {myChart2.pan(5)}, 20 );
  }
  panLeft.onmouseup = panLeft.onmouseleave = function() {
    clearInterval(pan);
    clearInterval(pan2);
  }
  panRight.onmousedown = function() {
    pan = setInterval( () => {myChart1.pan(-5)}, 20 );
    pan2 = setInterval( () => {myChart2.pan(-5)}, 20 );
  }
  panRight.onmouseup = panRight.onmouseleave = function() {
    clearInterval(pan);
    clearInterval(pan2);
  }

  //handel zoom/pan buttons
  let zoom: number;
  let zoom2: number;
  zoomIn.onmousedown = function() {
    zoom = setInterval( () => {myChart1.zoom(1.03)} , 20);;
    zoom2 = setInterval( () => {myChart2.zoom(1.03)} , 20);;
  }
  zoomIn.onmouseup = zoomIn.onmouseleave = function() {
    clearInterval(zoom);
    clearInterval(zoom2);
  }
  zoomOut.onmousedown = function() {
    zoom = setInterval(()=>{myChart1.zoom(0.97);}, 20);;
    zoom2 = setInterval(()=>{myChart2.zoom(0.97);}, 20);;
  }
  zoomOut.onmouseup = zoomOut.onmouseleave = function() {
    clearInterval(zoom);
    clearInterval(zoom2);
  }
  //only one option can be selected at one time. 
  //The selected option is highlighted by making the background Carolina blue
  function radioOnclick(radioOnClicked: HTMLInputElement, otherRadio: HTMLInputElement, graphMaxMin: graphScale): any {
    radioOnClicked.checked = true;
    setRadioLabelColor(radioOnClicked, true)
    otherRadio.checked = false;
    setRadioLabelColor(otherRadio, false)

    graphMaxMin.updateMode(radioOnClicked.id === "standardView" ? "auto" : "data")
    chartRescale([myChart1, myChart2], modelForm, graphMaxMin)
  }

//Alter radio input background color between Carolina blue and white
  function setRadioLabelColor(radio: HTMLInputElement, activate: boolean) {
    document.getElementById(radio.id + "Label").style.backgroundColor = activate ? "#4B9CD3" : "white"
  }
//remember you may have to change the dependencies here to work for the chart
  function zoompanDeactivate(graphMaxMin: graphScale): any {
    graphMaxMin.updateMode(null);
    standardViewRadio.checked = false;
    frameOnDataRadio.checked = false;
    setRadioLabelColor(standardViewRadio, false)
    setRadioLabelColor(frameOnDataRadio, false)
    setTimeout(function () {
      myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
        modelForm["red"].value, modelForm["blue"].value)
      myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
        modelForm["red2"].value, modelForm["blue2"].value)
      myChart2.update()
      myChart1.update()
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
        {
          data: "B",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Berr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "V",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Verr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "R",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Rerr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "I",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Ierr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
      ],
      hiddenColumns: { columns: [1, 3, 4, 5, 6, 7] },
    })
  );
  // create chart
  console.log('ayyo');


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
      aspectRatio: 0.75,
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
            onPan: () => { zoompanDeactivate(graphMinMax) },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
            onZoom: () => { zoompanDeactivate(graphMinMax) },
          },
        },
        title: {
          display: true,
          align: "end",
          padding: {
            top: 45,
            bottom: 5,
          }
        },
        legend: {
          display: false,
          align: "end",
          labels: {
            filter: function(item) {
              // Logic to remove a particular legend item goes here
              //remove the legend item for the model2
              const aff = !item.text.includes("");
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
      aspectRatio: 0.75,
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
            onPan: () => { zoompanDeactivate(graphMinMax) },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
            onZoom: () => { zoompanDeactivate(graphMinMax) },
          },
        },
        legend: {
          align: "start",
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

  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
        modelForm["red"].value, modelForm["blue"].value)
      myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
            modelForm["red2"].value, modelForm["blue2"].value)
      //console.log("bingus")
      myChart1.update()
      myChart2.update()
    }, 10)
  }
console.log('ayyo3')
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    console.log('bongus')
    updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax);
    console.log('bongus')
  };
console.log('bongus')
  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });
  console.log('bongus')
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);

  clusterForm.oninput = throttle(
    function () { updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax); },
    frameTime);

  // link chart to model form (slider + text)
  // modelForm.oninput=
  modelForm.oninput = throttle(function () {
    updateHRModel(modelForm, hot, [myChart1, myChart2], () => {
      updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax);
      });
   }, 100);

  //initializing website

console.log('ayyo4.1')
   //figure out why this update is breaking the code and it does not break the code in the other one
  update();
  console.log('bongus')
  updateHRModel(modelForm, hot, [myChart1, myChart2]);
  document.getElementById("standardView").click();
console.log('ayyo4.2')
  myChart1.options.plugins.title.text = "Title";
  myChart1.options.scales["x"].title.text = "x";
  myChart1.options.scales["y"].title.text = "y";
  myChart2.options.plugins.title.text = "";
  myChart2.options.scales["x"].title.text = "x";
  myChart2.options.scales["y"].title.text = "y";
  console.log('bongus')
  updateLabels(
    myChart1,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false
  );
  updateLabels(
    myChart2,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false
);
console.log('bongus')
const chartTypeForm = document.getElementById('chart-type-form') as HTMLFormElement;
chartTypeForm.addEventListener("change" , function () {
console.log("glizzy");
//destroy the chart
 //testing a bunch of creating charts and destroying them to make the thing work
 myChart1.destroy();
 myChart2.destroy();

 //(document.getElementById("myChart1")).remove();
 //(document.getElementById("myChart2")).remove();
});
  return [hot, myChart1, myChart2, modelForm, graphMinMax];
  
}
console.log('bongus')
/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 * @param {graphScale} graphMaxMin the graphScale object that includes chart bounding information
 */
export function cluster2FileUpload(evt: Event, table: Handsontable, myChart1: Chart<'line'>, myChart2: Chart<"line">, graphMaxMin: graphScale,) {
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
console.log('ayyo6.1')
  const reader = new FileReader();
  reader.onload = () => {
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const modelForm = document.getElementById("model-form") as ModelForm;
    // console.log(clusterForm.elements['d'].value);
    clusterForm["d"].value = Math.log(3).toString();
    clusterForm["err"].value = "1";
    // console.log(clusterForm.elements['d'].value);
    clusterForm["err_num"].value = "1";
    modelForm["age"].value = "6.6";
    clusterForm["red"].value = "0";
    modelForm["metal"].value = "-3.4";
    clusterForm["d_num"].value = "3";
    modelForm["age_num"].value = "6.6";
    clusterForm["red_num"].value = "0";
    modelForm["metal_num"].value = "-3.4";
    myChart1.options.plugins.title.text = "Title";
    myChart1.data.datasets[2].label = "Data";
    myChart1.options.scales["x"].title.text = "x";
    myChart1.options.scales["y"].title.text = "y";
    //myChart2.options.plugins.title.text = "Title";
    myChart2.data.datasets[2].label = "Data";
    myChart2.options.scales["x"].title.text = "x";
    myChart2.options.scales["y"].title.text = "y";
    updateLabels(
      myChart1,
      document.getElementById("chart-info-form") as ChartInfoForm,
      false,
      false,
      false,
      false
    );
    updateLabels(
      myChart2,
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
    const blue2 = modelForm["blue2"];
    const red2 = modelForm["red2"];
    const lum2 = modelForm["lum2"];

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
    //knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters
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
    changeOptions(blue2, optionList);
    changeOptions(red2, optionList);
    changeOptions(lum2, optionList);


    blue.value = filters[0];
    red.value = filters[1];
    lum.value = filters[1];
    blue2.value = filters[0];
    red2.value = filters[1];
    lum2.value = filters[1];

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
    //    console.log(tableData);


    updateHRModel(modelForm, table, [myChart1, myChart2],
      () => {
    table.updateSettings({
      data: tableData,
      colHeaders: headers,
      columns: columns,
      hiddenColumns: { columns: hiddenColumns },
    }); //hide all but the first 3 columns
    updateTableHeight(table);
        updateScatter(table, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMaxMin);
    document.getElementById("standardView").click();
  });
  }
  reader.readAsText(file);
}
