
export class CSVReader {
    constructor(csvFile: File, csvString: string) {
        if (this.verify(csvFile)) {
            this.csv = csvString;
        }
    }

    private _csv: string;

    get csv(): string { return this._csv; }
    set csv(csv: string) { if (csv.length !== 0) this._csv = csv; }

    /**
     * Verifies that the uploaded file exists and is a csv. Does not 
     * verify that the csv is of the desired format.
     *
     * @param file - uploaded file
     * @returns - true if the file is not undefined
     */
    verify(csvFile: File): boolean {
        if (csvFile === undefined) return false;
        if (!csvFile.type.match("(text/csv|application/vnd.ms-excel)")) {
            if (!csvFile.name.match(".*\.csv")) return false;
        }
        return true;
    }

    /**
     * Parses a csv assuming that the first row contains a title describing
     * the data contained in the columns. Returns an object using the first
     * row's cells data as keys.
     * 
     * @returns - indexable object containing the csv columns
     */
    parse(): object {
        const rows = this.csv.trim().split('\n');
        const headers = rows.shift()?.trim().split(',') || [];
        const result: any = {};

        // initialize the keys using the header information
        for (let header of headers) result[header] = [];

        // populate the object with the csv data
        rows.forEach((row) => {
            const values = row.trim().split(',');
            for (let i = 0; i < values.length; i++) {
                result[headers[i]].push(values[i]);
            }
        });
        return result;
    }
}