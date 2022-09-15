import Handsontable from "handsontable";
import {getClusterCenter, maxMinRaDec, starData} from "./chart-cluster-gaia";
import {baseUrl, httpGetAsync} from "./chart-cluster-util";

export function updateScrapeFormOnclick(table: Handsontable=null){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    if (table){
        if (scrapeForm.object.value){
            queryObjectLocation(scrapeForm.object.value);
        } else {
            const stars = tableDataToStars(table)
            const range = getClusterCenter(stars[1], stars[0]);
            // @ts-ignore
            updateScrapeFormRange(range['ra'], range['dec'], range['r']);
        }
    } else {
        scrapeForm.ra.value = '';
        scrapeForm.dec.value = '';
        scrapeForm.radius.value = '';
        scrapeForm.object.value = '';
        scrapeForm.isGaia.checked = false;
        scrapeForm.isVerzier.checked = false;
        scrapeForm.isOriginal.checked = false;
        scrapeForm.isOriginal.disabled = true;
        document.getElementById('isOriginalRow').style.opacity = '0.4';
    }
}

export function updateComputeLookupButton(isEmptyObj: boolean = false){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    if (isEmptyObj) {
        scrapeForm.object.value = '';
    }
    if (scrapeForm.object.value){
        document.getElementById('computeCenter').innerHTML = 'Look up'; //my roommate said look up is two words
    } else {
        document.getElementById('computeCenter').innerHTML = 'Compute';
    }
}

export function updateScrapeFormOnupload(ra: number, dec: number, r: number){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    updateScrapeFormRange(ra, dec, r);
    scrapeForm.isOriginal.disabled = false;
    document.getElementById('isOriginalRow').style.opacity = '1';
    scrapeForm.object.value = '';
    updateComputeLookupButton(true);
}

function updateScrapeFormRange(ra: number|string, dec: number|string, r: number|string){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    ra = typeof('ra') === 'number' ? ra as number: parseFloat(ra as string);
    dec = typeof('dec') === 'number' ? dec as number: parseFloat(dec as string);
    r = typeof('r') === 'number' ? r as number: parseFloat(r as string);
    scrapeForm.ra.value = ra.toFixed(2).toString();
    scrapeForm.dec.value = dec.toFixed(2).toString();
    scrapeForm.radius.value = r.toFixed(3).toString();
}

function tableDataToStars(table: Handsontable): [starData[], number[]]{
    let tableDict = table.getSourceData();
    let result: starData[] = [];
    const clusterForm = document.getElementById('cluster-form') as ClusterForm;
    const filter = clusterForm.red.value
    // @ts-ignore
    let minMax = [tableDict[0][filter+'ra'], tableDict[0][filter+'ra'], tableDict[0][filter+'dec'], tableDict[0][filter+'dec']]
    for (const entry of tableDict) {
        let star = new starData(null, null, null, null, null,
            // @ts-ignore
            entry[filter+'ra'], entry[filter+'dec'], null, [null, null])
        result.push(star)
        minMax = maxMinRaDec(star, minMax)
    }
    return [result, minMax]
}

function queryObjectLocation(object: string){
    let url = baseUrl + "/location-query?object=" + object
    httpGetAsync(url,
        (result: string)=>{
            result = JSON.parse(result);
            // @ts-ignore
            updateScrapeFormRange(result['RA'], result['DEC'], result['Range']);
        },
        ()=>{
            alert('Object query failed, check your input!');
            const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
            scrapeForm.object.value = '';
        }
        )
}
