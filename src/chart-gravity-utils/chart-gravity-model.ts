
import {baseUrl, httpGetAsync} from "../chart-cluster-utils/chart-cluster-util";
import {ratioMassLogSpace, totalMassLogSpace} from "./chart-gravity-grid-dimension";


export function updateGravityModel(gravityForm: GravityForm)


/**
 * generate url for Gravity Model data fetching
 * @param gravityForm
 */
export function generateURL(gravityForm: GravityForm) {
    const [totalMass, ratioMass] = fitValuesToGrid(gravityForm)


    return baseUrl + "/gravity?"
        + "totalMass=" + totalMass.toString()
        + "&ratioMass=" + ratioMass.toString()
}

function fitValuesToGrid(gravityForm : GravityForm){
    let totalMass = parseFloat(gravityForm["mass_num"].value);
    let ratioMass = parseFloat(gravityForm["ratio_num"].value);

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
    console.log(roundedMassRatio)

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
    console.log(roundedTotalMass)

    return [roundedTotalMass, roundedMassRatio];
}
