import {baseUrl, httpGetAsync} from "../chart-cluster-util";
import {modelFormKey} from "../chart-cluster-utils/chart-cluster-util";


/**
 * generate url for HRModel data fetching
 * @param form
 * @param chartNum
 */
export function generateURL(form: ModelForm, chartNum: number) {
    let blueKey = modelFormKey(chartNum, 'blue');
    let redKey = modelFormKey(chartNum, 'red');
    let lumKey = modelFormKey(chartNum, 'lum');
    let age = parseFloat(HRModelRounding(form['age_num'].value));
    if (age < 6.6)
        age = 6.6;
    else if (age > 10.3)
        age = 10.3;
    let metal = parseFloat(HRModelRounding(form['metal_num'].value))
    if (metal < -3.4)
        metal = -3.4;
    else if (metal > 0.2)
        metal = 0.2;
    return baseUrl + "/isochrone?"
        + "age=" + age.toString()
        + "&metallicity=" + metal.toString()
        + "&filters=[%22" + form[blueKey].value.replace('\'', 'prime')
        + "%22,%22" + form[redKey].value.replace('\'', 'prime')
        + "%22,%22" + form[lumKey].value.replace('\'', 'prime') + "%22]"
}
