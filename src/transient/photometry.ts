import { FILTERS } from "../chart-transient-utils/chart-transient-util";
import { pluralize } from "../utilities/string";

/**
 * Represents a row of the data table
 */
export interface Row {
    uncertainty: number;
    julianDate: number;
    magnitude: number;
    filter: string;

    [key: string]: any;
}

/**
 * Allows properties from the Photometry class to be referenced via their
 * names. This is useful for performing identical operations on different 
 * properties. See the class method 'filterBy(...)' for an application.
 */
export interface Photometry {
    [key: string]: any;
}

/**
 * TBD 
 */
export class Photometry {

    constructor();
    constructor(data: Row[]);
    constructor(data?: Row[]) {
        if (data === undefined) data = this.generateMockData();

        this.data = data;
        this.magnitudes = data.map(d => d.magnitude);
        this.julianDates = data.map(d => d.julianDate);
        this.uncertainties = data.map(d => d.uncertainty);
        this.filters = data.map(d => d.filter);

        this._julianDateOffset = 0.0;
        this._numberOfRows = this.magnitudes.length;
    
        // magnitude offsets are unique to each filter
        for (let filter of this.getUniqueFilters()) {
            this.magnitudeOffsets[filter] = 0.0;
        }
    }

    private _julianDates: number[];
    private _magnitudes: number[];
    private _filters: string[];
    private _uncertainties: number[];
    private _numberOfRows: number;
    private _julianDateOffset: number;

    magnitudeOffsets: { [key: string]: number } = {};

    get julianDates(): number[] { return this._julianDates; }
    set julianDates(j: number[]) { this._julianDates = j; }

    get magnitudes(): number[] { return this._magnitudes; }
    set magnitudes(m: number[]) { this._magnitudes = m; }

    get filters(): string[] { return this._filters; }
    set filters(f: string[]) { this._filters = f; }

    get uncertainties(): number[] { return this._uncertainties; }
    set uncertainties(u: number[]) { this._uncertainties = u; }

    get numberOfRows(): number { return this._numberOfRows; }

    get julianDateOffset(): number { return this._julianDateOffset; }
    set julianDateOffset(os: number) { this._julianDateOffset = os; }

    getMagnitudeOffset(filter: string): number {
        const os = this.magnitudeOffsets[filter];
        if (os === undefined) {
            throw new RangeError(`Filter '${filter}' does not exist in the photometry data`);
        }
        return this.magnitudeOffsets[filter];
    }

    setMagnitudeOffset(filter: string, os: number) {
        // do not alllow adding filters that are not in the data
        if (!this.filters.includes(filter)) {
            throw new RangeError("Filter '" + filter + "' does not exist in the photometry data");
        }
        this.magnitudeOffsets[filter] = os;
    }

    /**
     * Returns a deepcopy of the data. Passing photometry.data into the Handsontable
     * passed an actual reference to the data which meant that the table was being 
     * modified if the photometry data was modified. However, updating the table did
     * not modify the photometry data leading to some confusing behavior. 
     * 
     * @returns list of Row objects
     */
    clone(): Row[] {
        let rows: Row[] = [];

        for (let row of this.data) {
            rows.push({uncertainty: row.uncertainty,
                       julianDate: row.julianDate,
                       magnitude: row.magnitude,
                       filter: row.filter});
        }
        return rows;
    }

    /**
     * Returns mock data that is easily fitted to. This is purely for
     * show when loading in the page and will be overwritten when the 
     * user uplaods their own dataset.
     * 
     * @returns list of Row data
     */
    private generateMockData(): Row[] {
        return [{ uncertainty: 0.1, julianDate: 1., magnitude: 9.527800, filter: 'B' },
                { uncertainty: 0.1, julianDate: 2., magnitude: 10.01700, filter: 'B' },
                { uncertainty: 0.1, julianDate: 3., magnitude: 10.30310, filter: 'B' },
                { uncertainty: 0.2, julianDate: 4., magnitude: 10.49430, filter: 'V' },
                { uncertainty: 0.2, julianDate: 5., magnitude: 10.65180, filter: 'V' },
                { uncertainty: 0.2, julianDate: 6., magnitude: 10.78050, filter: 'V' },
                { uncertainty: 0.2, julianDate: 7., magnitude: 10.88930, filter: 'V' },
                { uncertainty: 0.2, julianDate: 8., magnitude: 10.89580, filter: 'R' },
                { uncertainty: 0.2, julianDate: 9., magnitude: 10.97890, filter: 'R' },
                { uncertainty: 0.2, julianDate: 10., magnitude: 11.0533, filter: 'R' },
                { uncertainty: 0.2, julianDate: 11., magnitude: 11.1205, filter: 'R' },
                { uncertainty: 0.2, julianDate: 12., magnitude: 11.1819, filter: 'R' },
                { uncertainty: 0.3, julianDate: 13., magnitude: 11.0864, filter: 'I' },
                { uncertainty: 0.3, julianDate: 14., magnitude: 11.1387, filter: 'I' },
                { uncertainty: 0.3, julianDate: 15., magnitude: 11.1870, filter: 'I' },
            ];
    }

    /**
     * Offsets the julian date data by the specified amount in the negative direction.
     * 
     * @param ros - offset value
     */
    offsetJulianDates(ros: number) {
        const aos = ros + this.julianDateOffset;
        if (!isNaN(ros) && ros !== 0) {
            for (let i = 0; i < this._numberOfRows; i++) {
                this.julianDates[i] -= ros;
                this.data[i].julianDate -= ros;
            }
            this.julianDateOffset = aos;
        }
        return ros; // return os to make updating chart easier
    }

    /**
     * Offsets the magnitude data by the specified amount for the given filter.
     * 
     * @param filter - filter name with magnitudes to shift
     * @param ros - signed offset to shift by
     * @returns ros
     */
    offsetMagnitude(filter: string, ros: number) {
        // Absolute offset is compared to the table data (this is what the user sees)
        const aos = ros + this.getMagnitudeOffset(filter);
        if (ros !== 0 && !isNaN(ros)) {
            for (let i = 0; i < this._numberOfRows; i++) {
                if (this.filters[i] === filter) {
                    this.magnitudes[i] += ros;
                    this.data[i].magnitude += ros;
                }
            }
            this.setMagnitudeOffset(filter, aos);
        }
        return ros; // return ros to make updating chart easier
    }

    createRowsFromLists(julianDates: number[], magnitudes: number[], uncertainties: number[], filters: string[]) {
        if (magnitudes.length !== julianDates.length || julianDates.length !== uncertainties.length || 
            uncertainties.length !== filters.length) {
            throw new RangeError("Mismatch in size of one or more of the row data");
        }

        let rows: Row[] = [];
        for (let i = 0; i < filters.length; i++) {
            rows.push({uncertainty: uncertainties[i], julianDate: julianDates[i],
                       magnitude: magnitudes[i], filter: filters[i]});
        }
        return rows;
    }

    /**
     * Replaces the existing data with the new data
     * 
     * @param data list of Row data
     */
    update(data: Row[]) {
        this.julianDates = [], this.magnitudes = [];
        this.uncertainties = [], this.filters = [];

        for (let row of data) {
            this.julianDates.push(row.julianDate);
            this.magnitudes.push(row.magnitude);
            this.uncertainties.push(row.uncertainty);
            this.filters.push(row.filter);
        }
        this._numberOfRows = data.length;
        this.data = data;
    }

    /**
     * Returns a deep copy of the row at the i-th index
     * 
     * @param i - i-th index for a row of points
     * @returns - deep copy of the i-th row of points
     */
    cloneRow(i: number): Row {
        if (i < 0 || i >= this._numberOfRows) {
            throw new RangeError("Index " + i.toString() + " out of bounds for size " + 
            this._numberOfRows.toString());
        }
        return {julianDate: this.julianDates[i],
                uncertainty: this.uncertainties[i],
                magnitude: this.magnitudes[i],
                filter: this.filters[i]};
    }

    /**
     * Returns a shallow copy of the row at the i-th index
     * 
     * @param i - i-th index for a row of points
     * @returns - shallow copy of the i-th row of points
     */
    getRow(i: number): Row {
        if (i < 0 || i >= this.data.length) {
            throw new RangeError("Index " + i.toString() + " out of bounds for size " + 
            this._numberOfRows.toString());
        }
        return this.data[i];
    }

    addRow(row: Row) {
        this.data.push(row);
        this.julianDates.push(row.julianDate);
        this.magnitudes.push(row.magnitude);
        this.uncertainties.push(row.uncertainty);
        this.filters.push(row.filter);
        this._numberOfRows += 1;
    }

    updateRow(index: number, row: Row) {
        this.data[index] = row;
        this.julianDates[index] = row.julianDate;
        this.magnitudes[index] = row.magnitude;
        this.uncertainties[index] = row.uncertainty;
        this.filters[index] = row.filter;
    }

    updateRowValue(index: number, prop: string, newValue: any) {
        const pluralizedProp = pluralize(prop);
        this.data[index][prop] = newValue;
        this[pluralizedProp][index] = newValue;
    }

    /**
     * 
     * @param index - starting Index to remove
     * @param amount - the number of rows to remove (including starting index)
     */
    removeRows(index: number, amount: number) {
        if (index + amount > this._numberOfRows) {
            throw new RangeError("Attempted to remove rows that do not exist.");
        }
        this.data.splice(index, amount);
        this.julianDates.splice(index, amount);
        this.magnitudes.splice(index, amount);
        this.uncertainties.splice(index, amount);
        this.filters.splice(index, amount);
        this._numberOfRows -= amount;
    }

    insertRows(index: number, rows: Row[], remove: number = 0) {
        let magnitudes: number[] = [], julianDates: number[] = [];
        let uncertainties: number[] = [], filters: string[] = [];

        // console.log(index, this._numberOfRows, this.data);
        for (let row of rows) {
            julianDates.push(row.julianDate);
            magnitudes.push(row.magnitude);
            uncertainties.push(row.uncertainty);
            filters.push(row.filter);
        }
        this.data.splice(index, remove, ...rows);
        this.julianDates.splice(index, remove, ...julianDates);
        this.magnitudes.splice(index, remove, ...magnitudes);
        this.uncertainties.splice(index, remove, ...uncertainties);
        this.filters.splice(index, remove, ...filters);
        this._numberOfRows += rows.length - remove;

        // console.log(index, this._numberOfRows, this.data);
    }

    rowIsValid(row: Row): boolean {
        if (isNaN(row.julianDate) || row.julianDate === null) {
            return false;
        }
        if (isNaN(row.magnitude) || row.magnitude === null) {
            return false;
        }
        if (isNaN(row.uncertainty) || row.uncertainty === null) {
            return false;
        }
        if (!FILTERS.includes(row.filter) || row.filter === null) {
            return false;
        }
        return true;
    }

    /**
     * Removes all rows of photometry data that contain the property value
     * that is outside of the provided bounds. One bound and not the other 
     * may be passed to filter via a floor or ceil
     * 
     * @param property - value to filter by: 'magnitude' | 'julianDate' | 'uncertainty'
     * @param [min] - inclusive minimum acceptable value
     * @param [max] - inclusive maximum acceptable value
     */
    filterBy(property: 'magnitude' | 'julianDate', min?: number, max?: number) {
        if (min === null && max === null) { return; }

        // ... syntax is required for methods to recognize arg as an array
        const floor = min ?? Math.min(...this[property + 's']);
        const ceil = max ?? Math.max(...this[property + 's']);

        // use temporary object to prevent modifying the array that we are iterating over 
        const filteredData: Row[] = [];
        for (let i = 0; i < this[property + 's'].length; i++) {
            if (this[property + 's'][i] >= floor && this[property + 's'][i] <= ceil) {
                filteredData.push({
                    magnitude: this.magnitudes[i],
                    julianDate: this.julianDates[i],
                    uncertainty: this.uncertainties[i],
                    filter: this.filters[i]
                });
            }
        }
        this.update(filteredData);
    }

    /**
     * Groups the list of Rows by their shared filter names
     * 
     * @returns An object containing filter names as keys and all other data as values
     */
    groupByFilterName() {
        const filterMap = new Map();
        for (let row of this.data) {
            if (!filterMap.has(row.filter)) {
                filterMap.set(row.filter, []);
            }
            filterMap.get(row.filter).push({
                julianDate: row.julianDate,
                magnitude: row.magnitude,
                uncertainty: row.uncertainty,
                filter: row.filter, 
            });
        }
        return filterMap;
    }

    /**
     * Returns the set of unique filter names
     * @returns array of unique filters
     */
    getUniqueFilters(): string[] {
        return Array.from(new Set(this.filters))
    }
}
