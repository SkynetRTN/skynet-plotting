import Handsontable from "handsontable";
import {getClusterCenter, maxMinRaDec, starData} from "./chart-cluster-gaia";
import {baseUrl, httpGetAsync, httpPostAsync} from "./chart-cluster-util";
import {updateClusterOnNewData} from "./chart-cluster-file-beta";
import {Chart} from "chart.js";
import {graphScale} from "./chart-cluster-scatter";
import {proFormMinmax, updateProForm} from "./chart-cluster-pro-util";
import {deActivateInterfaceOnFetch} from "./chart-cluster-interface";

export function resetScraperForm(isCoord: boolean, isCheckbox: boolean, isOriginal: boolean) {
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    if (isCoord) {
        scrapeForm.ra.value = '';
        scrapeForm.dec.value = '';
        scrapeForm.radius.value = '';
    }
    scrapeForm.object.value = '';
    if (isCheckbox) {
        scrapeForm.isGaia.disabled = false;
        document.getElementById("isGaiaRow").style.opacity = "1";
        scrapeForm.isGaia.checked = false;
        scrapeForm.isApass.disabled = false;
        scrapeForm.isApass.checked = false;
        document.getElementById("isApassRow").style.opacity = "1";
        scrapeForm.is2Mass.disabled = false;
        scrapeForm.is2Mass.checked = false;
        document.getElementById("is2MassRow").style.opacity = "1";
        scrapeForm.isWise.disabled = false;
        scrapeForm.isWise.checked = false;
        document.getElementById("isWiseRow").style.opacity = "1";
    }
    if (isOriginal) {
        scrapeForm.isOriginal.checked = true;
        scrapeForm.object.disabled = true;
        document.getElementById("objRow").style.opacity = "0.6"
    } else {
        scrapeForm.isOriginal.checked = false;
        scrapeForm.object.disabled = false;
        document.getElementById("objRow").style.opacity = "1"
    }


}

export function updateScraperParameters(table: Handsontable) {
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    if (scrapeForm.object.value) {
        queryObjectLocation(scrapeForm.object.value);
    } else {
        const stars = tableDataToStars(table)
        const range = getClusterCenter(stars[1], stars[0]);
        // @ts-ignore
        updateScrapeFormRange(range['ra'], range['dec'], range['r']);
    }
}

export function updateComputeLookupButton(isEmptyObj: boolean = false) {
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    if (isEmptyObj) {
        scrapeForm.object.value = '';
    }
    if (scrapeForm.object.value) {
        document.getElementById('computeCenter').innerHTML = 'Look up'; //my roommate said look up is two words
    } else {
        document.getElementById('computeCenter').innerHTML = 'Measure';
    }
}

export function updateScrapeFormOnupload(ra: number, dec: number, r: number) {
    updateScrapeFormRange(ra, dec, r);
    resetScraperForm(false, true, true);
    updateComputeLookupButton(true);
}

function updateScrapeFormRange(ra: number | string, dec: number | string, r: number | string) {
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    ra = typeof ('ra') === 'number' ? ra as number : parseFloat(ra as string);
    dec = typeof ('dec') === 'number' ? dec as number : parseFloat(dec as string);
    r = typeof ('r') === 'number' ? r as number : parseFloat(r as string);
    scrapeForm.ra.value = ra.toFixed(2).toString();
    scrapeForm.dec.value = dec.toFixed(2).toString();
    scrapeForm.radius.value = r.toFixed(3).toString();
}

function tableDataToStars(table: Handsontable): [starData[], number[]] {
    let tableDict = table.getSourceData();
    let result: starData[] = [];
    let keys = Object.keys(tableDict[0]);
    if (keys[0] == 'id') {
        keys = keys.splice(2);
    }
    let filters: string[] = [];
    for (let i = 0; i < keys.length; i += 7) {
        filters.push(keys[i]);
    }
    // @ts-ignore
    let minMax = [NaN, NaN, NaN, NaN]
    for (const filter of filters) {
        for (const entry of tableDict) {
            let star = new starData(null, null, null, null, null,
                // @ts-ignore
                entry[filter + 'ra'], entry[filter + 'dec'], null, [null, null])
            if (star.ra && star.dec) {
                result.push(star);
                minMax = maxMinRaDec(star, minMax);
            }
        }
    }
    return [result, minMax]
}

function queryObjectLocation(object: string) {
    let url = baseUrl + "/location-query?object=" + object
    httpGetAsync(url,
        (result: string) => {
            result = JSON.parse(result);
            // @ts-ignore
            updateScrapeFormRange(result['RA'], result['DEC'], result['Range']);
        },
        () => {
            alert('Object query failed, check your input!');
            const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
            scrapeForm.object.value = '';
        }
    )
}

export function queryVizieR(table: Handsontable, mycharts: Chart[], graphMaxMin: graphScale, proChart: Chart) {
    const scrapeForm = document.getElementById('cluster-scraper') as ClusterScraperForm;
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
    const ra = scrapeForm.ra.value;
    const dec = scrapeForm.dec.value;
    const r = scrapeForm.radius.value;
    if (!(ra && dec && r)) {

        alert('RA, DEC, and Radius have to be provided for query!');
        return
    }

    let catalog: string[] = [];
    if (!scrapeForm.isGaia.disabled && scrapeForm.isGaia.checked) {
        catalog.push('gaia')
    }
    if (!scrapeForm.isApass.disabled && scrapeForm.isApass.checked) {
        catalog.push('apass')
    }
    if (!scrapeForm.is2Mass.disabled && scrapeForm.is2Mass.checked) {
        catalog.push('twomass')
    }
    if (!scrapeForm.isWise.disabled && scrapeForm.isWise.checked) {
        catalog.push('wise')
    }
    if (catalog.length === 0) {
        alert('Please Select a Database to Query');
        return
    } else {
        let currTableData: any[][] = [[]];
        let currTableDataKeys: string[] = [];

        if (scrapeForm.isGaia.disabled
            || scrapeForm.isApass.disabled
            || scrapeForm.is2Mass.disabled
            || scrapeForm.isWise.disabled
            || scrapeForm.isOriginal.checked) {
            currTableData = table.getData();
            currTableDataKeys = table.getColHeader() as string[];
            // currTableDataKeys = Object.keys(table.getSourceData()[0]);
        }

        let queryRestriction = {
            'distance': {'min': null, 'max': null},
            'pmra': {'min': null, 'max': null},
            'pmdec': {'min': null, 'max': null},
        };

        if (clusterForm.distrangeCheck.checked) {
            const dist_range_abs = parseFloat(clusterForm.d_num.value) * parseFloat(clusterForm.distrange_num.value)/100;
            queryRestriction.distance.min = 1000 * (parseFloat(clusterForm.d_num.value) - dist_range_abs);
            queryRestriction.distance.max = 1000 * (parseFloat(clusterForm.d_num.value) + dist_range_abs);
        }

        if (clusterProForm.rarangeCheck.checked) {
            queryRestriction.pmra.min = parseFloat(clusterProForm.ramotion_num.value) - parseFloat(clusterProForm.rarange_num.value);
            queryRestriction.pmra.max = parseFloat(clusterProForm.ramotion_num.value) + parseFloat(clusterProForm.rarange_num.value);
        }

        if (clusterProForm.decrangeCheck.checked) {
            queryRestriction.pmdec.min = (parseFloat(clusterProForm.decmotion_num.value) - parseFloat(clusterProForm.decrange_num.value));
            queryRestriction.pmdec.max = parseFloat(clusterProForm.decmotion_num.value) + parseFloat(clusterProForm.decrange_num.value);
        }

        const query = {
            'ra': ra, 'dec': dec, 'r': r,
            'catalog': catalog.concat(','),
            'keys': currTableDataKeys,
            'data': currTableData,
            'constrain': queryRestriction,
        };

        const url = baseUrl + "/vizier-query";
        deActivateInterfaceOnFetch(false);
        httpPostAsync(url,
            query,
            (result: string) => {
                if (result.includes('failure')) {
                    const error = JSON.parse(result) as any;
                    deActivateInterfaceOnFetch(true);
                    if (error['failure'].includes('Object input invalid type')) {
                        alert('VizieR query failed, your input for coordinates needs to be numbers!');
                    } else if (error['failure'].includes('Radius too big')) {
                        alert('VizieR query failed, too many stars to process! Please reduce your radius');
                    }
                }
                let data = JSON.parse(result) as any;
                try {
                    updateClusterOnNewData(table, data['data'], data['filters'], mycharts, graphMaxMin, proChart);

                    if (!scrapeForm.isGaia.disabled &&
                        !scrapeForm.isApass.disabled &&
                        !scrapeForm.is2Mass.disabled &&
                        !scrapeForm.isWise.disabled &&
                        !scrapeForm.isOriginal.checked) {
                        const proMinMax = proFormMinmax(table, clusterForm);
                        updateProForm(proMinMax, clusterProForm);
                    }

                    if (!scrapeForm.isGaia.disabled && scrapeForm.isGaia.checked) {
                        scrapeForm.isGaia.disabled = true;
                        document.getElementById("isGaiaRow").style.opacity = "0.6";
                    }
                    if (!scrapeForm.isApass.disabled && scrapeForm.isApass.checked) {
                        scrapeForm.isApass.disabled = true;
                        document.getElementById("isApassRow").style.opacity = "0.6";
                    }
                    if (!scrapeForm.is2Mass.disabled && scrapeForm.is2Mass.checked) {
                        scrapeForm.is2Mass.disabled = true;
                        document.getElementById("is2MassRow").style.opacity = "0.6";
                    }
                    if (!scrapeForm.isWise.disabled && scrapeForm.isWise.checked) {
                        scrapeForm.isWise.disabled = true;
                        document.getElementById("isWiseRow").style.opacity = "0.6";
                    }

                } catch (e) {
                    deActivateInterfaceOnFetch(true);
                    console.log(e)
                }
            },
            (result: string) => {
                console.log(result)
                deActivateInterfaceOnFetch(true);
                alert('VizieR query failed, check your input!');
            }
        )
    }
}

