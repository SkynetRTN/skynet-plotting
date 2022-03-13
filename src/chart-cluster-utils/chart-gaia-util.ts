export class starData{
    id: string
    ra: number
    dec: number
    radius: number
    constructor(id: string, ra: number, dec: number){
        this.id = id
        this.ra = ra
        this.dec = dec
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
//when the database returns the star ranges and id's, export a function that matches them back to the magnitude and filter data
export function matchStarData(stars: starData[], data: Map<string, Map<string, number>>){ 
    