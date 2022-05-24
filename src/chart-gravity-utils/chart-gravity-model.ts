
import {baseUrl, httpGetAsync} from "../chart-cluster-utils/chart-cluster-util";
import {ratioMassLogSpace, totalMassLogSpace} from "./chart-gravity-grid-dimension";


export function updateGravModelData(gravityModelForm: GravityModelForm, updateChartCallback: Function = () => { }){
    const [totalMass, ratioMass, totalMassDivGridMass] = fitValuesToGrid(gravityModelForm);
    httpGetAsync(generateURL(totalMass, ratioMass), (response: string) => {
        let json = JSON.parse(response);
        let dataTable = json['data'];
        updateChartCallback(dataTable, totalMassDivGridMass)}, () => {})
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
