export const verifyCSV = (file: File) => {
    if (file === undefined) {
        return false;
    }
    // file exists - is it .csv?
    if (!file.type.match("(text/csv|application/vnd.ms-excel)")) {
        if (!file.name.match(".*\.csv")) {
            console.log("Uploaded file type is: ", file.type);
            console.log("Uploaded file name is: ", file.name);
            alert("Please upload a CSV file.");
            return false;
        }
    }
    return true;
};


const getDataFromCSV = (data: string[], cols: string[], colIds: number[], key: string) => {

    const keyIdx = cols.indexOf(key);
    const cMagIdx = cols.indexOf('calibrated_mag');
    const map = new Map();

    for (const row of data) {
        let items = row.trim().split(',');

        if (!map.has(items[keyIdx])) {
            map.set(items[keyIdx], []);
        }
        if (key === 'id' && colIds.length === 3) {
            const [col1, col2, col3] = colIds;

            if (items[cMagIdx] !== "") {
                map.get(items[keyIdx]).push([
                    parseFloat(items[col1]),
                    parseFloat(items[col2]),
                    items[col3]
                ]);
            }
        } else if (key === 'filter' && colIds.length === 3) {
            const [col1, col2, col3] = colIds;

            map.get(items[keyIdx]).push([
                parseFloat(items[col1]),
                parseFloat(items[col2]),
                parseFloat(items[col3])
            ]);
        } else if (colIds.length === 1) {
            const col1 = colIds[0];

            map.get(items[keyIdx]).push([
                parseFloat(items[col1])
            ]);
        } else {
            return map;
        }

    }
    return map;
};


export function readCSVData(reader: FileReader) {
    console.log('Reading in data..');

    const data = {
        source: new Map(),
        filter: new Map(),
        errors: new Map(),
        zeroPoints: new Map(),
        valid: false, // unused
    }

    let csvData = (reader.result as string).split("\n")
        .filter(str => (str !== null && str !== undefined && str !== ""));

    if (csvData.length > 10000) {
        return data;
    } else {
        data.valid = true;
    }

    let cols = csvData[0].trim().split(",");
    csvData.splice(0, 1);

    const sourceCols = [cols.indexOf('mjd'),
        cols.indexOf('mag'),
        cols.indexOf('filter')];
    data.source = getDataFromCSV(csvData, cols, sourceCols, 'id')

    const filterCols = [cols.indexOf('mjd'),
        cols.indexOf('mag'), cols.indexOf('mag_error')];
    data.filter = getDataFromCSV(csvData, cols, filterCols, 'filter')

    const errorCol = [cols.indexOf('mag_error')];
    data.errors = getDataFromCSV(csvData, cols, errorCol, 'filter');

    const zeroPointCols = [cols.indexOf('zero_point_correction')];
    data.zeroPoints = getDataFromCSV(csvData, cols, zeroPointCols, 'zero_point_correction');

    console.log('Finished reading in data.');
    return data;
}
