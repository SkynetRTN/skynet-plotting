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
    motion: number[]
    constructor(id: string, distance: number, motion: number[]){
        this.id = id
        this.distance = distance
        this.motion = motion
    }
}

export function sortStarid(chunk1: starData[], chunk2: starData[]){
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
export function sortStarDuplicates(dataArray: starData[]): starData[]{
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
    let sortedStars = sortStarid(sortStarDuplicates(dataArrayLeft), sortStarDuplicates(dataArrayRight))
    //delete the duplicates
    let uniqueStars = []
    let lastStar = sortedStars[0]
    uniqueStars.push(lastStar)
    for (let i = 1; i < sortedStars.length; i++){
        if (sortedStars[i].id !== lastStar.id){
            uniqueStars.push(sortedStars[i])
            lastStar = sortedStars[i]
        }
    }
    return uniqueStars
}

export function maxMinRaDec(dataArray: starData[]){
    let maxRa = dataArray[0].ra
    let minRa = dataArray[0].ra
    let maxDec = dataArray[0].dec
    let minDec = dataArray[0].dec
    for (let i = 1; i < dataArray.length; i++){
        if (dataArray[i].ra > maxRa){
            maxRa = dataArray[i].ra
        }
        if (dataArray[i].ra < minRa){
            minRa = dataArray[i].ra
        }
        if (dataArray[i].dec > maxDec){
            maxDec = dataArray[i].dec
        }
        if (dataArray[i].dec < minDec){
            minDec = dataArray[i].dec
        }
    }
    return [maxRa, minRa, maxDec, minDec]
}

