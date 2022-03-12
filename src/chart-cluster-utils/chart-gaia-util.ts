export class starData{
    id: number
    ra: number
    dec: number
    radius: number
    constructor(id: number, ra: number, dec: number){
        this.id = id
        this.ra = ra
        this.dec = dec
    }
}
export function sortStarid(chunk1: number[], chunk2: number[]){
    let dataArray = []
    while (chunk1.length && chunk2.length) {
        // Pick the smaller among the smallest element of left and right sub arrays 
        if (chunk1[0] < chunk2[0]) {
            dataArray.push(chunk1.shift())  
        } else {
            dataArray.push(chunk2.shift()) 
        }
    }
    return[...dataArray, ...chunk1, ...chunk2]
}
export function sortStarDuplicates(dataArray: number[]): number[]{
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
    return sortStarid(sortStarDuplicates(dataArrayLeft), sortStarDuplicates(dataArrayRight))
}