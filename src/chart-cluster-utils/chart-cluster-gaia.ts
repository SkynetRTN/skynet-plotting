export class starData{
    id: string
    ra: number
    dec: number
    radius: number
    distance: number
    motion: number []
    constructor(id: string, ra: number, dec: number, distance: number, motion: number[]){
        this.id = id
        this.ra = ra
        this.dec = dec
        this.distance = distance
        this.motion = motion
    }
}
export class gaiaData{
    id: string
    distance: number
    motion: number []
}

export function sortStar(dataArray: starData[]): starData[][]{
    let sortedStars = mergeSortStar(dataArray);
    //delete the duplicates
    let uniqueStars = []
    let lastStar = sortedStars[0]
    let minMax: number[] = [lastStar.ra, lastStar.ra, lastStar.dec, lastStar.dec]
    uniqueStars.push(lastStar)
    for (let i = 1; i < sortedStars.length; i++){
        if (sortedStars[i].id !== lastStar.id){
            lastStar = sortedStars[i]
            uniqueStars.push(lastStar)
            minMax = maxMinRaDec(lastStar, minMax)
        }
    }
    return [sortedStars, uniqueStars]
}


function mergeSortStar(dataArray: starData[]): starData[]{
    //merge sort all the stars by their id
    //let idArray = starData.map(star => star.id)
    //break the array into chunks of size 2
    //let chunk1 = idArray.slice(0, idArray.length/2)
    let half = dataArray.length/2
    if (dataArray.length < 2){
        return dataArray
    }

    let dataArrayLeft = dataArray.slice(0, half)
    let dataArrayRight = dataArray.slice(half, dataArray.length)
    return mergeStarid(mergeSortStar(dataArrayLeft), mergeSortStar(dataArrayRight))
}

function mergeStarid(chunk1: starData[], chunk2: starData[]){
    let dataArray = []
    while (chunk1.length && chunk2.length) {
        // Pick the smaller among the smallest element of left and right sub arrays
        if (chunk1[0].id < chunk2[0].id) {
            dataArray.push(chunk1.shift())
        } else {
            dataArray.push(chunk2.shift())
        }

    }
    return[...dataArray, ...chunk1, ...chunk2]
}

function maxMinRaDec(star: starData, minMax: number[]){
    let maxRa = minMax[0]
    let minRa = minMax[1]
    let maxDec = minMax[2]
    let minDec = minMax[3]
    if (star.ra > maxRa){
        maxRa = star.ra
    }
    if (star.ra < minRa){
        minRa = star.ra
    }
    if (star.dec > maxDec){
        maxDec = star.dec
    }
    if (star.dec < minDec){
        minDec = star.dec
    }
    return [maxRa, minRa, maxDec, minDec]
}
//export function starDistnaceMotionArray()
