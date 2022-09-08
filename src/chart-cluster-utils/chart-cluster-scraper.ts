import Handsontable from "handsontable";
import {getClusterCenter, maxMinRaDec, starData} from "./chart-cluster-gaia";

export function updateScrapeFormOnclick(table: Handsontable=null){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    if (table){
        const stars = tableDataToStars(table)
        const range = getClusterCenter(stars[1], stars[0]);
        // @ts-ignore
        updateScrapeFormRange(range['ra'], range['dec'], range['r']);
    } else {
        scrapeForm.ra.value = '';
        scrapeForm.dec.value = '';
        scrapeForm.radius.value = '';
        scrapeForm.isGaia.checked = false;
        scrapeForm.isVerzier.checked = false;
        scrapeForm.isOriginal.checked = false;
        scrapeForm.isOriginal.disabled = true;
        document.getElementById('isOriginalRow').style.opacity = '0.4';
    }
}

export function updateScrapeFormOnupload(ra: number, dec: number, r: number){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    updateScrapeFormRange(ra, dec, r);
    scrapeForm.isOriginal.disabled = false;
    document.getElementById('isOriginalRow').style.opacity = '1';
}

function updateScrapeFormRange(ra: number, dec: number, r: number){
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
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
