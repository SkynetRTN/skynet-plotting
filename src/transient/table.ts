'use strict';

import Handsontable from "handsontable";
import {tableCommonOptions} from "../config"
import { Row } from "./photometry";


export interface TableCoordinates {
    startRow: number, 
    startCol: number, 
    endRow: number, 
    endCol: number,
}

export class TransientTable {
    constructor(data: Row[]) {
        this.container = document.getElementById('table-div');
        this.table = this.create();
        this.table.updateData(data);
    }

    container: any;
    table: Handsontable;

    /**
     * Returns an empty HandsOnTable that is formatted for the Transient Plotting Tool
     * 
     * @returns Dataless HandsOnTable
     */
    private create() {
        return new Handsontable(this.container, Object.assign({}, tableCommonOptions, {
            data: [],
            maxCols: 4,
            columns: [
                {data: 'julianDate', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
                {data: 'magnitude', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
                {data: 'filter', type: 'text'},
                {data: 'uncertainty', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            ],
            colHeaders: ['MJD', 'Magnitude', 'Filter', 'Uncertainty'],
        }));
    }
}
