
import { Chart, ScatterDataPoint } from "chart.js";
import {baseUrl, httpGetAsync, httpPostAsync} from "../chart-cluster-utils/chart-cluster-util";
import {ratioMassLogSpace, totalMassLogSpace, ratioMassLogSpaceStrain, totalMassLogSpaceStrain} from "./chart-gravity-grid-dimension";
import Handsontable from "handsontable";

export function updateGravModelData(gravityModelForm: GravityModelForm, updateChartCallback: Function = () => { }){
    // these are split up because the frequency model had a different less dense grid than the strain one
    const [totalMass, ratioMass, totalMassDivGridMass] = fitValuesToGrid(gravityModelForm);
    const [totalMassStrain, ratioMassStrain, totalMassDivGridMassStrain] = fitValuesToGridStrain(gravityModelForm);
    httpGetAsync(generateURL(totalMass, ratioMass, totalMassStrain, ratioMassStrain), (response: string) => {
        let json = JSON.parse(response);
        let strainTable = json['strain_model'];
        let freqTable = json['freq_model']
        updateChartCallback(strainTable, freqTable, totalMassDivGridMassStrain)}, () => {})
        
}

// Here we want a function like updateGravModeldata that takes the same arguments as well as the whitened data stored in the table
// and we will send that data to /gravity api call to be bandpassed and back again to update the strain data in the table
////////////////////////////////////
///////////////////////////////////
export function updateRawStrain(gravityModelForm: GravityModelForm, sessionID: string, updateChartCallback: Function = () => {}) {
    const [totalMass, ratioMass, totalMassDivGridMass] = fitValuesToGridStrain(gravityModelForm);
    const url = generateURLData(totalMass, ratioMass, sessionID);

    httpPostAsync(url, {}, (response: string) => {
        let json = JSON.parse(response);
        let data = json['data'];
        let snrMax = json['snrMax']
        // console.log('snrMax: ', snrMax)
        updateChartCallback(data);
    }, () => {});
}
/////////////////////////////////////////////////
////////////////////////////////////////////////
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
        return avgMag; //Whoever divided this by ten before, why?
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
function generateURL(totalMass: number, ratioMass: number, totalMassStrain: number, ratioMassStrain: number) {
    
    return baseUrl + "/gravity?"
        + "totalMass=" + totalMass.toString()
        + "&ratioMass=" + ratioMass.toString()
        + "&totalMassStrain=" + totalMassStrain.toString()
        + "&ratioMassStrain=" + ratioMassStrain.toString()
}

function generateURLData(totalMass: number, ratioMass: number, sessionID: string) {

    return baseUrl + "/gravitydata?"
        + "totalMass=" + totalMass.toString()
        + "&ratioMass=" + ratioMass.toString()
        + "&sessionID=" + sessionID
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

function fitValuesToGridStrain(gravityModelForm : GravityModelForm){
    let totalMass = parseFloat(gravityModelForm["mass_num"].value);
    let ratioMass = parseFloat(gravityModelForm["ratio_num"].value);

    // Fitting the sliders to each logspace
    //Mass Ratio
    const differences_mr: number[] = [];
    for (let i = 0; i < ratioMassLogSpaceStrain.length; i++){
        differences_mr.push(Math.abs(ratioMass - ratioMassLogSpaceStrain[i]));
    }

    let min_mr: number = 251;
    let argmin_mr = 0;
    for (let i = 0; i < ratioMassLogSpaceStrain.length; i++){
        if (differences_mr[i] < min_mr) {
            min_mr = differences_mr[i];
            argmin_mr = i;
        }
    }
    let roundedMassRatio = ratioMassLogSpaceStrain[argmin_mr];

    //Total Mass
    const differences_tm: number[] = [];
    for (let i = 0; i < totalMassLogSpaceStrain.length; i++){
        differences_tm.push(Math.abs(totalMass - totalMassLogSpaceStrain[i]));
    }

    let min_tm: number = 251;
    let argmin_tm = 0;
    for (let i = 0; i < totalMassLogSpaceStrain.length; i++){
        if (differences_tm[i] < min_tm) {
            min_tm = differences_tm[i];
            argmin_tm = i;
        }
    }
    let roundedTotalMass = totalMassLogSpaceStrain[argmin_tm];
    let totalMassDivGridMass = totalMass / roundedTotalMass;
    return [roundedTotalMass, roundedMassRatio, totalMassDivGridMass];
}
