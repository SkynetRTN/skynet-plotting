import {round} from "./my-math"
export function radio(): any {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Radio" id="radio-form" style="padding-bottom: .5em">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Source: </div>\n' +
        '<div class="col-sm-5"><select name="source" id="source" style="width: 100%;" title="Source">\n' +
        '<option value="w" title="Cas A" selected>Cas A</option>\n' +
        '<option value="x" title="Cyg A">Cyg A</option>\n' +
        '<option value="y" title="Tau A">Tau A</option>\n' +
        '<option value="z" title="Vir A">Vir A</option>\n' +
        '</select></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Start Frequency (MHz): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="startFreq" min="10" max="100000" title="Start Frequency" value=1355></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Stop Frequency (MHz): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="stopFreq" min="10" max="100000" title="Stop Frequency" value=1435></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Date (Years): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="year" id="year" min="2000" title="Year" value=2022.95></input></div>\n' +
        '</div>\n' +
        '<div class="row justify-content-end">\n' +
        '<div class="graphControl"><button id="compute" style="width: 100%;">Compute</button></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Flux Density (Jy): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="string" step="0.001" name="fluxDensity" min="10" max="100000" id="FluxDensity"></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Effective Frequency (MHz): </div>\n' +
        '<div class="col-sm-5"><input class="field" type="string" step="0.001" name="effectiveFrequency" min="10" max="100000" id="EffectiveFrequency"></input></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-12" style="color: grey;">Trotter, A. S, Reichart, D. E., Egger, R. E., et al. 1997, MNRAS, 469, 1299</div>\n' +
        '</div>\n' +
        '</form>\n');
    
    const radioForm = document.getElementById('radio-form') as RadioForm;
    radioForm.elements['fluxDensity'].disabled = true;
    radioForm.elements['fluxDensity'].style.opacity = "100";
    radioForm.elements['effectiveFrequency'].disabled = true;
    radioForm.elements['effectiveFrequency'].style.opacity = "100";
    document.getElementById('table-div').hidden = true;
    document.getElementById('add-row-button').hidden = true;
    document.getElementById('save-button').hidden = true;
    document.getElementById('dataInput').hidden = true;
    document.getElementById('titleInput').hidden = true;
    document.getElementById('titleLabel').hidden = true;
    document.getElementById('dataLabel').hidden = true;

    const sourceBox = (document.getElementById("source") as HTMLInputElement);   
    sourceBox.addEventListener("change", () => {
      if (radioForm.elements['source'].value == 'x' || radioForm.elements['source'].value == 'z') {
        radioForm.elements['year'].disabled = true;
        radioForm.elements['year'].style.opacity = "1";
      } else {
        radioForm.elements['year'].disabled = false;
        radioForm.elements['year'].style.opacity = "100";
      }
    });

    let fluxButton = document.getElementById('compute') as HTMLInputElement
    fluxButton.onclick = (e) => {
        e.preventDefault();
        if (parseFloat(radioForm.elements['year'].value) < 2000 ||  isNaN(parseFloat(radioForm.elements['year'].value)) == true){
            radioForm.elements['year'].value = (2000).toString()
        }
        if (parseFloat(radioForm.elements['startFreq'].value) < 10 ||  isNaN(parseFloat(radioForm.elements['startFreq'].value)) == true){
            radioForm.elements['startFreq'].value = (10).toString()
        }
        if (parseFloat(radioForm.elements['startFreq'].value) > 100000){
            radioForm.elements['startFreq'].value = (100000).toString()
        }
        if (parseFloat(radioForm.elements['stopFreq'].value) < 10 || isNaN(parseFloat(radioForm.elements['stopFreq'].value)) == true){
            radioForm.elements['stopFreq'].value = (10).toString()
        }
        if (parseFloat(radioForm.elements['stopFreq'].value) > 100000){
            radioForm.elements['stopFreq'].value = (100000).toString()
        }
        if (parseFloat(radioForm.elements['stopFreq'].value) < parseFloat(radioForm.elements['startFreq'].value)){
            radioForm.elements['stopFreq'].value = radioForm.elements['startFreq'].value
        }
        let [fluxAvg, uncertainty, finalEffectiveFreq]= fluxGenesis(
            parseFloat(radioForm.elements['year'].value),
            parseFloat(radioForm.elements['startFreq'].value),
            parseFloat(radioForm.elements['stopFreq'].value),
            radioForm.elements['source'].value,
        );
        fluxAvg = round(fluxAvg, 1)
        uncertainty = round(uncertainty, 1)
        finalEffectiveFreq = round(finalEffectiveFreq, 1)
        radioForm.elements['fluxDensity'].value = fluxAvg.toString() +  " +/- " + uncertainty.toString()
        radioForm.elements['effectiveFrequency'].value = finalEffectiveFreq.toString()
    }

    return []
}

/**
 * This function approximates the flux density of a calibration source -- and includes error bars -- all based on 
 * The fading of Cassiopeia A, and improved models for the absolute spectrum of primary radio calibration sources 2018
 *  @param form:    A form containing the four parameters - calibration source, start frequency, stop frequency, and current year (or the year your data is from)
 * 
 * /*/
function fluxGenesis(year: number, startFreq: number, stopFreq: number, source: string) {
    let fluxSum  = 0
    let sigmaFluxSum = 0
    let effectiveFreqSum = 0
    let t_ref = 0
    let t_0 = 0
    let logF_0 = 0 
    let a_1 = 0
    let nu_ref = 0
    let a_2 = 0
    let a_3 = 0
    let mnu_0 = 0
    let mdeltlog = 0
    let nu_0 = 0
    let varianceLogF_0 = 0
    let variancea_1 = 0
    let variencea_2 = 0
    let variencea_3 = 0
    let variencemnu_0 = 0
    let variencemdeltlog = 0
    let t = year

    if(source == 'w') {
        t_ref = 2006.9
        t_0 = 2005.64
        logF_0 = 3.2530
        a_1 = -0.732
        nu_ref = 1477
        a_2 = -0.0094
        a_3 = 0.0053
        mnu_0 = -0.00350
        mdeltlog = 0.00124
        nu_0 = 1315
        varianceLogF_0 = 0.0051**2
        variancea_1 = 0.011**2
        variencea_2 = 0.0058**2 
        variencea_3 = 0.0058**2
        variencemnu_0 = 0.00022**2
        variencemdeltlog = 0.00018**2
    } else if(source == 'x'){
        t_ref = 0
        t_0 = 0
        logF_0 = 3.1861
        a_1 = -1.038
        nu_ref = 1416
        a_2 = -0.1457
        a_3 = 0.0170
        mnu_0 = 0
        mdeltlog = 0
        nu_0 = 1 //should be null, just need to avoid dividing by zero -- Math.log(nu / nu_0) will never be zero because nu is never negative or zero
        varianceLogF_0 = 0.0046**2
        variancea_1 = 0.011**2
        variencea_2 = 0.0075**2 
        variencea_3 = 0.0075**2
        variencemnu_0 = 0
        variencemdeltlog = 0
    } else if(source == 'y'){
        t_ref = 2009.05
        t_0 = 2009.05
        logF_0 = 2.9083
        a_1 = -0.226
        nu_ref = 1569
        a_2 = -0.0113
        a_3 = -0.0275
        mnu_0 = -0.00044
        mdeltlog = 0
        nu_0 = 1 //should be null, just need to avoid dividing by zero -- Math.log(nu / nu_0) will never be zero because nu is never negative or zero
        varianceLogF_0 = 0.0044**2
        variancea_1 = 0.014**2
        variencea_2 = 0.0081**2 
        variencea_3 = 0.0077**2
        variencemnu_0 = 0.00019**2
        variencemdeltlog = 0
    } else if(source == 'z'){
        t_ref = 0
        t_0 = 0
        logF_0 = 2.3070
        a_1 = -0.876
        nu_ref = 1482
        a_2 = -0.047
        a_3 = -0.073
        mnu_0 = 0
        mdeltlog = 0
        nu_0 = 1 //should be null, just need to avoid dividing by zero -- Math.log(nu / nu_0) will never be zero because nu is never negative or zero
        varianceLogF_0 = 0.0045**2
        variancea_1 = 0.017**2
        variencea_2 = 0.0031**2 
        variencea_3 = 0.0030**2
        variencemnu_0 = 0
        variencemdeltlog = 0
    }
    // use the trapezoidal rule to aproximate eq 14 -- stepsize 0.001
    let deltax = (stopFreq - startFreq) / 100000
    for (let nu = startFreq; nu < stopFreq + deltax; nu = nu + deltax) {
        if(nu == startFreq || nu == stopFreq){
            let equation14 = logF_0 + a_1 * Math.log(nu / nu_ref) + a_2 * (Math.log(nu / nu_ref))**2 + a_3 * (Math.log(nu / nu_ref))**3 
                + (mnu_0 *  (t - t_ref)+ mdeltlog *  (t - t_0) *  Math.log(nu / nu_0))
            // Keeping the temporal component in the equation, since they will drop anyway for all unecessary sources
            let equation15 = Math.sqrt(varianceLogF_0 + variancea_1 * (Math.log(nu / nu_ref))**2 + variencea_2 * (Math.log(nu / nu_ref))**4 
                + variencea_3 * (Math.log(nu / nu_ref))**6 + variencemnu_0 * (t - t_ref)**2 + variencemdeltlog * (Math.log(nu / nu_0))**2 * (t - t_0)**2)
            let effectiveFreq = nu * 10**(logF_0 + a_1 * Math.log(nu / nu_ref) + a_2 * (Math.log(nu / nu_ref))**2 + a_3 * (Math.log(nu / nu_ref))**3 
                + (mnu_0 *  (t - t_ref)+ mdeltlog *  (t - t_0) *  Math.log(nu / nu_0)))
            fluxSum += 10**(equation14)
            sigmaFluxSum += 10**(equation14 + equation15)
            effectiveFreqSum += effectiveFreq
        }  
        if(startFreq < nu && nu < stopFreq){
            let equation14 = logF_0 + a_1 * Math.log(nu / nu_ref) + a_2 * (Math.log(nu / nu_ref))**2 + a_3 * (Math.log(nu / nu_ref))**3 
                + (mnu_0 *  (t - t_ref)+ mdeltlog *  (t - t_0) *  Math.log(nu / nu_0))
            let equation15 = Math.sqrt(varianceLogF_0 + variancea_1 * (Math.log(nu / nu_ref))**2 + variencea_2 * (Math.log(nu / nu_ref))**4 
                + variencea_3 * (Math.log(nu / nu_ref))**6 + variencemnu_0 * (t - t_ref)**2 + variencemdeltlog * (Math.log(nu / nu_0))**2 * (t - t_0)**2)
            let effectiveFreq = nu * 10**(logF_0 + a_1 * Math.log(nu / nu_ref) + a_2 * (Math.log(nu / nu_ref))**2 + a_3 * (Math.log(nu / nu_ref))**3 
                + (mnu_0 *  (t - t_ref)+ mdeltlog *  (t - t_0) *  Math.log(nu / nu_0)))
            fluxSum += 10**(equation14) * 2
            // adding equation 14 to 15 gives us the value of the flux one sigma above the average -- our method of getting uncertainty
            sigmaFluxSum += 10**(equation14 + equation15) * 2
            effectiveFreqSum += effectiveFreq * 2
        }
    }
    let finalAvgFlux = (fluxSum * deltax / 2) / (stopFreq - startFreq)
    let finalSigmaAvgFlux = (sigmaFluxSum * deltax / 2) / (stopFreq - startFreq)
    let uncertainty = finalSigmaAvgFlux - finalAvgFlux
    let finalEffectiveFreq = (effectiveFreqSum * deltax / 2) / (finalAvgFlux * (stopFreq - startFreq))
    //console.log('avg flux: ', finalAvgFlux, 'uncertainty: ', uncertainty)
    return [finalAvgFlux, uncertainty, finalEffectiveFreq]
}