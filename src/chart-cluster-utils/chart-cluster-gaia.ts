export class starData{
    id: string

    filter: string
    err: number
    filteredMag: number
    mag: string
    ra: number
    dec: number
    radius: number
    distance: number
    motion: number[]
    constructor(id: string, filter: string, err: number, filteredMag: number, mag: string, ra: number, dec: number, distance: number, motion: number[]){
        this.id = id;
        this.filter = filter;
        this.err = err
        this.filteredMag = filteredMag
        this.mag = mag;
        this.ra = ra;
        this.dec = dec;
        this.distance = distance;
        this.motion = motion;
    }
}

export function sortStar(dataArray: starData[]): [starData[], any]{
    let sortedStars = mergeSortStar(dataArray);
    //delete the duplicates
    let uniqueStars = [];
    let lastStar = {id: sortedStars[0].id, ra: sortedStars[0].ra, dec: sortedStars[0].dec};
    let minMax: number[] = [lastStar.ra, lastStar.ra, lastStar.dec, lastStar.dec];
    uniqueStars.push(lastStar);
    for (let i = 1; i < sortedStars.length; i++){
        if (sortedStars[i].id !== lastStar['id']){
            lastStar = {id: sortedStars[i].id, ra: sortedStars[i].ra, dec: sortedStars[i].dec};
            uniqueStars.push(lastStar);
            minMax = maxMinRaDec(sortedStars[i], minMax);
        }
    }
    let query = {'data': uniqueStars, 'range': getClusterCenter(minMax, uniqueStars)}
    return [sortedStars, query]
}


function mergeSortStar(dataArray: starData[]): starData[]{
    //merge sort all the stars by their id
    //let idArray = starData.map(star => star.id)
    //break the array into chunks of size 2
    //let chunk1 = idArray.slice(0, idArray.length/2)
    function mergeStarid(chunk1: starData[], chunk2: starData[]){
        let dataArray = [];
        while (chunk1.length && chunk2.length) {
            // Pick the smaller among the smallest element of left and right sub arrays
            if (chunk1[0].id < chunk2[0].id) {
                dataArray.push(chunk1.shift());
            } else {
                dataArray.push(chunk2.shift());
            }

        }
        return[...dataArray, ...chunk1, ...chunk2]
    }
    let half = dataArray.length/2;
    if (dataArray.length < 2){
        return dataArray
    }
    let dataArrayLeft = dataArray.slice(0, half);
    let dataArrayRight = dataArray.slice(half, dataArray.length);
    return mergeStarid(mergeSortStar(dataArrayLeft), mergeSortStar(dataArrayRight))

}


function maxMinRaDec(star: starData, minMax: number[]){
    let maxRa = minMax[0];
    let minRa = minMax[1];
    let maxDec = minMax[2];
    let minDec = minMax[3];
    if (star.ra > maxRa){
        maxRa = star.ra;
    }
    if (star.ra < minRa){
        minRa = star.ra;
    }
    if (star.dec > maxDec){
        maxDec = star.dec;
    }
    if (star.dec < minDec){
        minDec = star.dec;
    }
    return [maxRa, minRa, maxDec, minDec]
}

function getClusterCenter(minMax: number[], stars: any[]){
    let maxRa = minMax[0];
    let minRa = minMax[1];
    let maxDec = minMax[2];
    let minDec = minMax[3];
    let deltaRa = maxRa - minRa;
    let wrap = false;
    if (deltaRa > 180) {
        wrap = true;
        for (let star of stars) {
            if (star['ra'] < minRa && star['ra'] > 180)
                minRa = star['ra'];
            if (star['ra'] > maxRa && star['ra'] < 180)
                maxRa = star['ra'];
        }
        if (minRa - maxRa < 180)
            return [0, 90, 90 - Math.abs(minDec)]
    }
    let centerRa = (minRa + maxRa)/2;
    if (minRa - maxRa > 180)
        if (centerRa > 180)
            centerRa -= 180
        else
            centerRa += 180
    let centerDec = (maxDec + minDec)/2
    let radius = haversine(maxDec, centerDec, maxRa, centerRa)
    return {'ra': centerRa, 'dec': centerDec, 'r': radius, 'wrap': wrap}
}

function haversine(dec1: number, dec2: number, ra1: number, ra2: number): number{
    let dec1_rad = radians(dec1)
    let dec2_rad = radians(dec2)
    let ra1_rad = radians(ra1)
    let ra2_rad = radians(ra2)
    let theta = 2 * Math.asin((Math.sin((dec1_rad - dec2_rad)/2)**2 + Math.cos(dec1_rad) * Math.cos(dec2_rad) * (Math.sin((ra1_rad - ra2_rad)/2))**2) ** 0.5)
    return (theta / Math.PI) * 180
}

function radians(degree: number): number{
    return (degree/180 * Math.PI)
}