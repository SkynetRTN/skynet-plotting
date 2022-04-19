/**
 * This file contains functions that inject essential HTML into index.html for Cluster interfaces
 */

import { floatMod } from "../my-math"
import { Chart, ScatterDataPoint } from "chart.js";

/**
 *  This function insert the clusterform and modelform into the website
 *  @param chartCounts: how many charts need to be controlled
 */
export function insertClusterControls(chartCounts:number = 1) {
    let htmlContent = '<form title="Cluster Diagram" id="cluster-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Distance (kpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Distance" name="d_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        //add a checkbox that disables the corresponding slider
        '<div class="col-sm-1"><input type="checkbox" class="range" checked="0" name="distrangeCheck" id="distrangeCheck"></input></div>\n' +
        '<div class = "col-sm-5 des">±Range (%):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Dist Range" name="distrange"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Dist Range" name="distrange_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">B – V Reddening (mag):</div>\n' +
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
        '<div class="row">\n'
    if (chartCounts === 1) {
        for (let i = 0; i < chartCounts; i++) {
            let num = ""
            if (i !== 0) {
                num = (i+1).toString()
            }
            //add a number that corresponds what graph each row of drop down boxes controls
            htmlContent +=
                '<div class="col-sm-4">Blue:</div>\n' +
                '<div class="col-sm-4">Red:</div>\n' +
                '<div class="col-sm-4">Luminosity:</div>\n' +
                "</div>\n" +
                '<div class="row">\n' +
                '<div class="col-sm-4"><select name="blue' + num + '" style="width: 100%;" title="Select Blue Color Filter">\n' +
                '<option value="B" title="B filter" selected>B</option></div>\n' +
                '<option value="V" title="V filter">V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n' +
                '<div class="col-sm-4"><select name="red' + num + '" style="width: 100%;" title="Red Color Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n' +
                '<div class="col-sm-4"><select name="lum' + num + '" style="width: 100%;" title="Select Luminosity Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n'
        }
    }
    if (chartCounts > 1) {
        htmlContent += '<div class="col-sm-1"></div>\n' +
            '<div class="col-sm-3">Blue:</div>\n' +
            '<div class="col-sm-1"></div>\n' +
            '<div class="col-sm-3">Red:</div>\n' +
            '<div class="col-sm-1"></div>\n' +
            '<div class="col-sm-3">Luminosity:</div>\n' +
            "</div>\n" +
            '<div class="row">\n'
        for (let i = 0; i < chartCounts; i++) {
            let num = ""
            let order = (i+1).toString()
            let logo = ""
            if (order === "1") {
                logo = "①"
            } else if (order === "2") {
                logo = "②"
            } else if (order === "3") {
                logo = "③"
            } else if (order === "4") {
                logo = "④"
            }
            if (i !== 0) {
                num = (i+1).toString()
            }
            //add a number that corresponds what graph each row of drop down boxes controls
            htmlContent += '<div class="col-sm-1" style="font-size: 20px;">' + logo + '</div>\n' +
                '<div class="col-sm-3"><select name="blue' + num + '" style="width: 100%;" title="Select Blue Color Filter">\n' +
                '<option value="B" title="B filter" selected>B</option></div>\n' +
                '<option value="V" title="V filter">V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n' +
                '<div class="col-sm-1"></div>\n' +
                '<div class="col-sm-3"><select name="red' + num + '" style="width: 100%;" title="Red Color Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n' +
                '<div class="col-sm-1"></div>\n' +
                '<div class="col-sm-3"><select name="lum' + num + '" style="width: 100%;" title="Select Luminosity Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n'
        }
    }


    htmlContent += "</div>\n" + "</form>\n"


    document
        .getElementById("input-div")
        .insertAdjacentHTML(
            "beforeend",
            htmlContent
        );
}
export function clusterProSliders(clusterPro: true = true) {
    if (clusterPro === true) {
    let htmlContent = "" 
    htmlContent += '<form id="clusterProForm" class="form-inline">\n' +
                   '</div>\n'
    htmlContent += '<div class="row" style = "padding-top: 14.25px">\n'
    htmlContent += '<div class = "col-sm-6 des">Motion in RA (mas/yr):</div>\n' +
                   '<div class="col-sm-4 range"><input type="range" title="ramotion" name="ramotion"></div>\n' +
                   '<div class="col-sm-2 text"><input type="number" title="Ra" name="ramotion_num" class="field"></div>\n' +
                     '</div>\n'
    htmlContent += '<div class="row">\n'
    htmlContent += '<div class="col-sm-1"><input type="checkbox" class="range" checked="" name="rarangeCheck" value="0" id="rarangeCheck"></input></div>\n' +
                   '<div class = "col-sm-5 des">±Range (mas/yr):</div>\n' +
                   '<div class="col-sm-4 range"><input type="range" title="rarange" name="rarange"></div>\n' +
                   '<div class="col-sm-2 text"><input type="number" title="rarange" name="rarange_num" class="field"></div>\n' +
                     '</div>\n'
    htmlContent += '<div class="row">\n'
    htmlContent += '<div class = "col-sm-6 des">Motion in Dec (mas/yr):</div>\n' +
                     '<div class="col-sm-4 range"><input type="range" title="decmotion" name="decmotion"></div>\n' +
                        '<div class="col-sm-2 text"><input type="number" title="decmotion" name="decmotion_num" class="field"></div>\n' +
                        '</div>\n'
    htmlContent += '<div class="row">\n'
    htmlContent += '<div class="col-sm-1"><input type="checkbox" class="range" checked="" name="decrangeCheck" value="0" id="decrangeCheck"></input></div>\n' +
                     '<div class = "col-sm-5 des">±Range (mas/yr):</div>\n' +
                        '<div class="col-sm-4 range"><input type="range" title="decrange" name="decrange"></div>\n' +
                        '<div class="col-sm-2 text"><input type="number" title="decrange" name="decrange_num" class="field"></div>\n' +
                        '</div>\n'
    htmlContent += '</div>\n'
    htmlContent += '</div>\n'
    document
        .getElementById("chart-div1")
        .insertAdjacentHTML(
            "beforeend",
            htmlContent
        );
}}

/**
 * Insert graph control and on-control buttons into html code
 * @param chartCount the number of charts will be controlled
 * @private
 */
export function insertGraphControl(chartCount: number = 1){
    let html = '<div class = "extra" id = "scaleGraphNo">\n';

    if (chartCount > 1) {
        for (let i = 0; i < chartCount; i++) {
            html +=
                '<label class="scaleSelection scaleSelection-graphSelection" id="frameChart' + (i+1).toString() +  '">' +
                '<input type="radio" class="scaleSelection" id="radioChart' + (i+1).toString() +
                '" name="chartCount" value="' + (i+1).toString() + '"' +
                (i === 0 ? 'checked' : '')  +
                '><div style="position: relative; bottom: 4px; left:7.5px">'
                +    (i+1).toString() +
                '</div></label>\n'
        }
    }

    html += '<label class="scaleSelection" id="standardViewLabel">\n' +
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
    document.getElementById("extra-options").insertAdjacentHTML("beforeend", html)
}

export function rangeCheckControl(clusterChart = true){
    if (clusterChart === true) {
        const clusterForm = document.getElementById("cluster-form") as ClusterForm;
        (document.getElementById("distrangeCheck") as HTMLInputElement).checked = false;
        clusterForm["distrange"].disabled = true;
        clusterForm["distrange_num"].disabled = true;
        const distrangeCheckbox = (document.getElementById("distrangeCheck") as HTMLInputElement);   
        //clusterForm["distrange"].disabled = true;
        //clusterForm["distrange_num"].disabled = true;
        //clusterForm["distrange"].disabled = false;
        //clusterForm["distrange_num"].disabled = false;;
        distrangeCheckbox.addEventListener("change", () => {
          let rangeSlider = clusterForm["distrange"]
          let rangeNum = clusterForm["distrange_num"]
          if (distrangeCheckbox.checked) {
            rangeSlider.disabled = false;
            rangeNum.disabled = false;
            rangeSlider.style.opacity = "1";
          } else {
            rangeSlider.disabled = true;
            rangeNum.disabled = true;
            rangeSlider.style.opacity = "0.4";
            // clusterForm["distrange"].value = "100";
            // clusterForm["distrange_num"].value = "100";
          }
        });
    }
}

export function clusterProCheckControl (){
    const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
        (document.getElementById("rarangeCheck") as HTMLInputElement).checked = false;
        (document.getElementById("decrangeCheck") as HTMLInputElement).checked = false;
        clusterProForm["rarange"].disabled = true;
        clusterProForm["rarange_num"].disabled = true;
        clusterProForm["decrange"].disabled = true;
        clusterProForm["decrange_num"].disabled = true;
        const rarangeCheckbox = (document.getElementById("rarangeCheck") as HTMLInputElement);
        const decrangeCheckbox = (document.getElementById("decrangeCheck") as HTMLInputElement);
        rarangeCheckbox.addEventListener("change", () => {
            let rangeSlider = clusterProForm["rarange"]
            let rangeNum = clusterProForm["rarange_num"]
            if (rarangeCheckbox.checked) {
              rangeSlider.disabled = false;
              rangeNum.disabled = false;
              rangeSlider.style.opacity = "1";
            } else {
              rangeSlider.disabled = true;
              rangeNum.disabled = true;
              rangeSlider.style.opacity = "0.4";
            }
          });
            decrangeCheckbox.addEventListener("change", () => {
            let rangeSlider = clusterProForm["decrange"]
            let rangeNum = clusterProForm["decrange_num"]
            if (decrangeCheckbox.checked) {
              rangeSlider.disabled = false;
              rangeNum.disabled = false;
              rangeSlider.style.opacity = "1";
            } else {
              rangeSlider.disabled = true;
              rangeNum.disabled = true;
              rangeSlider.style.opacity = "0.4";
            }
          }
        );
}

export function clusterProButtons(){
    let html = '';
    html += 
        '<div class="row-clusterPro" style="margin-left: 18%">\n' +
        '<button class = "graphControl" id="panUpPro" style="margin-bottom: 1px;"><center class = "graphControl">&#8593;</center></button>\n' +
        '</div>' +
        '<div class="row" style="margin: 0;">\n' +
        '<button class = "graphControl" id="panLeftPro" style="margin-bottom: 1px;"><center class = "graphControl">&#8592;</center></button>&nbsp;\n' +
        '<button class = "graphControl" id="panRightPro" style="margin-bottom: 1px;"><center class = "graphControl">&#8594;</center></button>\n' +
        '</div>' +
        '<div class="row-clusterPro" style="margin-left: 18%">\n' +
        '<button class = "graphControl" id="panDownPro" style="margin-bottom: 1px;"><center class = "graphControl">&#8595;</center></button>\n' +
        '</div>' +
        '<div class="row" style="margin: 0;">\n' +
        '<button class = "graphControl" id="zoomInPro" style="margin-bottom: 1px;"><center class = "graphControl">&plus;</center></button>&nbsp;\n' +
        '<button class = "graphControl" id="zoomOutPro" style="margin-bottom: 1px;"><center class = "graphControl">&minus;</center></button>\n' +
        '</div>' +
        '<button class = "clusterRest" id="ResetPro" style="margin-bottom: 1px;"><div style="margin-left: 20%">Reset</div></button>\n' +
        '</div>' +
        '\n'
    document.getElementById("chart-pro-options").insertAdjacentHTML("beforeend", html)
    const chartTypeForm = document.getElementById("chart-type-form") as HTMLFormElement;
    document.getElementById('chart-div2-colControl').classList.remove('col-lg-6');
    document.getElementById('chart-div2-colControl').classList.add('col-lg-4');
      //add an event listener that changes the column size of chart-div2-colControl when the chart type is changed 
  //and also removes cluster-pro-options if the chart type is not cluster-pro
  chartTypeForm.addEventListener("change", function () {
    if (chartTypeForm.value != "cluster3") {
      document.getElementById("chart-pro-options").style.display = "none";
      document.getElementById('chart-div2-colControl').classList.remove('col-lg-4');
      document.getElementById('chart-div2-colControl').classList.add('col-lg-6');
    } else {
      document.getElementById("chart-pro-options").style.display = "block";
      document.getElementById('chart-div2-colControl').classList.remove('col-lg-4');
      document.getElementById('chart-div2-colControl').classList.add('col-lg-6');
    }
  });
}

export function clusterProButtonControl(chart: Chart){
    //add event listeners that will be used to control the chart based ion the clusterProButtons function
    document.getElementById("panLeftPro").addEventListener("click", () => {
        chart.pan(-5);
    });
    document.getElementById("panRightPro").addEventListener("click", () => {
        chart.pan(5);
    });
    document.getElementById("panUpPro").addEventListener("click", () => {
        chart.pan(5, []);
    });
    document.getElementById("panDownPro").addEventListener("click", () => {
        chart.pan(-5, []);
    });
    document.getElementById("zoomInPro").addEventListener("click", () => {
        chart.zoom(1.1);
    });
    document.getElementById("zoomOutPro").addEventListener("click", () => {
        chart.zoom(0.9);
    });
    document.getElementById("ResetPro").addEventListener("click", () => {
        chart.reset();
    });
}


//Since cluster Sim is going to be a little different, I'm going to make a separate interface function for it
export function insertClusterSimControls(chartCounts:number = 1) {
    let htmlContent =  '<form title="Sim Parameters" id="clustersim-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Number of Stars:</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Star Number" name="starNum"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Star Number" name="starNum_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Signal to Noise:</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Noise" name="noise"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Noise" name="noise_num" class="field"></div>\n' +
        "</div>\n" +
        "</form>\n" +
        '<form title="Cluster Diagram" id="cluster-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Distance (kpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Distance" name="d_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Scatter (%):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance Scatter" name="distScatter"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Distance Scatter" name="distScatter_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">B – V Reddening (mag):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Reddening" name="red"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Reddening" name="red_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Scatter (%):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Reddening Scatter" name="redScatter"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Reddening Scatter" name="redScatter_num" class="field"></div>\n' +
        "</div>\n" +
        "</form>\n" +
        '<form title="Filters" id="model-form" style="padding-bottom: .5em">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">log(Age (yr)):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Age" name="age"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Age" name="age_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Scatter (%):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Age Scatter" name="ageScatter"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Age Scatter" name="ageScatter_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Metallicity (solar):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Metallicity" name="metal_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Scatter (%):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Metal Scatter" name="metalScatter"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Metal Scatter" name="metalScatter_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-lg-6 des">     </div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-lg-3 des">     </div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-lg-3 des">     </div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-lg-3 des">     </div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-lg-3 des">     </div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="row" style = "padding-top: 12.25px">\n'+
        "</div>\n" +
        '<div class="row">\n'+
        '<div class="col-sm-6" style="color: grey;">Select Filters:</div>\n' +
        "</div>\n" +
        '<div class="row">\n' 
    if (chartCounts === 1) {
        for (let i = 0; i < chartCounts; i++) {
            let num = ""
            if (i !== 0) {
                num = (i+1).toString()
            }
            //add a number that corresponds what graph each row of drop down boxes controls
            htmlContent +=
                '<div class="col-sm-4">Blue:</div>\n' +
                '<div class="col-sm-4">Red:</div>\n' +
                '<div class="col-sm-4">Luminosity:</div>\n' +
                "</div>\n" +
                '<div class="row">\n' +
                '<div class="col-sm-4"><select name="blue' + num + '" style="width: 100%;" title="Select Blue Color Filter">\n' +
                '<option value="B" title="B filter" selected>B</option></div>\n' +
                '<option value="V" title="V filter">V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n' +
                '<div class="col-sm-4"><select name="red' + num + '" style="width: 100%;" title="Red Color Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n' +
                '<div class="col-sm-4"><select name="lum' + num + '" style="width: 100%;" title="Select Luminosity Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></select></div>\n'
        }
    }


    htmlContent += "</div>\n" + "</form>\n"


    document
        .getElementById("input-div")
        .insertAdjacentHTML(
            "beforeend",
            htmlContent
        );
}