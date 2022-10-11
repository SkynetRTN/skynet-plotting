
import { ScatterDataPoint } from "chart.js";
import {baseUrl, httpGetAsync} from "../chart-cluster-utils/chart-cluster-util";
import {ratioMassLogSpace, totalMassLogSpace} from "./chart-gravity-grid-dimension";


export function updateGravModelData(gravityModelForm: GravityModelForm, updateChartCallback: Function = () => { }){
    const [totalMass, ratioMass, totalMassDivGridMass] = fitValuesToGrid(gravityModelForm);
    httpGetAsync(generateURL(totalMass, ratioMass), (response: string) => {
        let json = JSON.parse(response);
        let strainTable = json['strain_model'];
        let freqTable = json['freq_model']
        updateChartCallback(strainTable, freqTable, totalMassDivGridMass)}, () => {})
        
}

//Extract strain model from the yellow model plotted over the spectogram :)
export function extract_strain_model(specto: number[][], model: ScatterDataPoint[] , x0: number, dx: number,y0: number,dy: number)
: ScatterDataPoint[] 
{
    var strain_model: ScatterDataPoint[] = [];
    model.forEach(value => {
        //find the approx.strain magnitude at this point from the spectogram
        let mag = get_Magnitude(value)
        //Make a cool NEW point and add it to our model. It's freq vs. time.
        strain_model.push( {x: value.x, y: mag*(10000000000000000) } as ScatterDataPoint )
    })

    //all done :)
    console.log(strain_model)
    return strain_model;

    function get_Magnitude(p: ScatterDataPoint): number{
        var addressX = Math.round((p.x - x0) / dx)
        var addressY = Math.round((p.y - y0) / dy)
        try{
            return specto[addressY][addressX]
        }
        catch (err){
            console.log("oopsies\n" + err);
            return 0;
        }
    }
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
