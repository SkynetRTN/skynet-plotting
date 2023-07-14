
import { Chart, ScatterDataPoint } from "chart.js";
import {baseUrl, httpGetAsync, httpPostAsync} from "../chart-cluster-utils/chart-cluster-util";
import {ratioMassLogSpace, totalMassLogSpace} from "./chart-gravity-grid-dimension";

export function updateGravModelData(gravityModelForm: GravityModelForm, updateChartCallback: Function = () => { }){
    const [totalMass, ratioMass, totalMassDivGridMass] = fitValuesToGrid(gravityModelForm);
    httpGetAsync(generateURL(totalMass, ratioMass), (response: string) => {
        let json = JSON.parse(response);
        let strainTable = json['strain_model'];
        let freqTable = json['freq_model']
        let data = json['data']
        updateChartCallback(strainTable, freqTable, data, totalMassDivGridMass)}, () => {})
        
}

// create another function that calls the data from the response string
// it seems like we must do it in the same fashion as the file upload process
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////


export async function sendDataToPass(ratioMass: number, totalMass: number, whitenedStrain: string, time: string): Promise<any> {
  try {
    const response = await fetch('/gravdata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ratioMass: ratioMass,
        totalMass: totalMass,
        whitenedStrain: whitenedStrain,
        time: time
      })
    });

    if (!response.ok) {
      throw new Error('Request failed with status: ' + response.status);
    }

    const responseData = await response.json();
    const processedData = responseData.data;

    return processedData;
  } catch (error) {
    console.error(error);

    return null;
  }
}


////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
export function updateRawStrainData(whitenedData: number[], time: number[]){
    var data: number[][] = [];
    httpPostAsync(generateURLData(25.000, 1.000, whitenedData, time), [whitenedData, time], (response: string) => {
        let json = JSON.parse(response);
        data = json['data']
    },
    (result: string) => {
        console.log(result)
        alert('Something went wrong updating strain bandpass!');
    })
    return data
}

//Extract strain model from the yellow model plotted over the spectogram :)
export function extract_strain_model(specto: number[][], chart: Chart , x0: number, dx: number,y0: number,dy: number)
: ScatterDataPoint[] 
{
    console.log(specto,' ',x0, ',',y0)
    let model = chart.data.datasets[0].data as {x: number, y: number}[];
    let upper = chart.data.datasets[1].data as {x: number, y: number}[];
    let lower = chart.data.datasets[2].data as {x: number, y: number}[];

    var strain_model: ScatterDataPoint[] = [];
    for(var i in model) 
    {
        //find the approx.strain magnitude at this point from the spectogram
        let mag = get_Magnitude(parseInt(i))
        //Make a cool NEW point and add it to our model. It's freq vs. time.
        strain_model.push( {x: model[i].x, y: mag} as ScatterDataPoint )
    }

    //all done :)
    return strain_model;

    function get_Magnitude(p: number): number{
        var addressX = Math.round((model[p].x - x0) / dx)
        var addressYUpper = Math.round((upper[p].y - y0) / dy)
        var addressYLower = Math.round((lower[p].y - y0) / dy)
        var sumMag = 0;
        for(var i = (addressYLower>0?addressYLower:0); i <= addressYUpper; i++)
        {
            try{
                sumMag += specto[addressX][i]; // Add scalar *1000000000000
            }
            catch (err){ console.log(i)}//pro error handling
        }
        var avgMag = sumMag / (addressYUpper- (addressYLower>0?addressYLower:0))
        return avgMag / 10.0;
    }
    //OLD VERSION
    // var strain_model: ScatterDataPoint[] = [];
    // model.forEach(value => {
    //     //find the approx.strain magnitude at this point from the spectogram
    //     let mag = get_Magnitude(value)
    //     //Make a cool NEW point and add it to our model. It's freq vs. time.
    //     strain_model.push( {x: value.x, y: mag*(10000000000000000) } as ScatterDataPoint )
    // })

    // //all done :)
    // return strain_model;

    // function get_Magnitude(p: ScatterDataPoint): number{
    //     var addressX = Math.round((p.x - x0) / dx)
    //     var addressY = Math.round((p.y - y0) / dy)
    //     try{
    //         return specto[addressY][addressX]
    //     }
    //     catch (err){
    //         console.log("oopsies\n" + err);
    //         return 0;
    //     }
    // }
}

/**
 * generate url for Gravity Model data fetching
 * @param totalMass
 * @param ratioMass
 */
function generateURL(totalMass: number, ratioMass: number) {

    return baseUrl + "/gravity?"
        + "totalMass=" + totalMass.toString()
        + "&ratioMass=" + ratioMass.toString()
}

function generateURLData(totalMass: number, ratioMass: number, whitenedData: number[], time: number[]) {

    return baseUrl + "/gravitydata?"
        + "totalMass=" + totalMass.toString()
        + "&ratioMass=" + ratioMass.toString()
        + "&whitenedData=" + whitenedData.toString()
        + "&time=" + time.toString()
}

function fitValuesToGrid(gravityModelForm : GravityModelForm){
    let totalMass = parseFloat(gravityModelForm["mass_num"].value);
    let ratioMass = parseFloat(gravityModelForm["ratio_num"].value);

    // Fitting the sliders to each logspace
    //Mass Ratio
    const differences_mr: number[] = [];
    for (let i = 0; i < ratioMassLogSpace.length; i++){
        differences_mr.push(Math.abs(ratioMass - ratioMassLogSpace[i]));
    }

    let min_mr: number = 251;
    let argmin_mr = 0;
    for (let i = 0; i < ratioMassLogSpace.length; i++){
        if (differences_mr[i] < min_mr) {
            min_mr = differences_mr[i];
            argmin_mr = i;
        }
    }
    let roundedMassRatio = ratioMassLogSpace[argmin_mr];

    //Total Mass
    const differences_tm: number[] = [];
    for (let i = 0; i < totalMassLogSpace.length; i++){
        differences_tm.push(Math.abs(totalMass - totalMassLogSpace[i]));
    }

    let min_tm: number = 251;
    let argmin_tm = 0;
    for (let i = 0; i < totalMassLogSpace.length; i++){
        if (differences_tm[i] < min_tm) {
            min_tm = differences_tm[i];
            argmin_tm = i;
        }
    }
    let roundedTotalMass = totalMassLogSpace[argmin_tm];
    let totalMassDivGridMass = totalMass / roundedTotalMass;
    return [roundedTotalMass, roundedMassRatio, totalMassDivGridMass];
}
