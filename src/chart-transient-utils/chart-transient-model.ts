import {formatFilterName, ZERO_POINT_VALUES} from "./chart-transient-util";
import {baseUrl, calculateLambda, filterWavelength} from "../chart-cluster-utils/chart-cluster-util";

const DEBUG = false;

export class Model {
    constructor(form: VariableLightCurveForm) {
        this.temporalIndex = parseFloat(form["a_num"].value);
        this.spectralIndex = parseFloat(form["b_num"].value);
        this.referenceTime = parseFloat(form["t_num"].value);
        this.referenceMagn = parseFloat(form["mag_num"].value);
        this.atmExtinction = parseFloat(form["ebv_num"].value);
        this.referenceFltr = form["filter"].value;
    }

    private _temporalIndex: number;

    /* GETTERS */
    get temporalIndex(): number {
        return this._temporalIndex;
    }

    /* SETTERS */
    set temporalIndex(i: number) {
        if (isNaN(i)) {
            this._temporalIndex = -0.65;
            console.log('temporal index set to -0.65');
        } else {
            this._temporalIndex = i;
        }
    }

    private _spectralIndex: number;

    get spectralIndex(): number {
        return this._spectralIndex;
    }

    set spectralIndex(i: number) {
        if (isNaN(i)) {
            this._spectralIndex = -0.5;
            console.log('spectral index set to -0.5');
        } else {
            this._spectralIndex = i;
        }
    }

    private _referenceTime: number;

    get referenceTime(): number {
        return this._referenceTime;
    }

    set referenceTime(t: number) {
        if (isNaN(t)) {
            this._referenceTime = 8.0;
            console.log('reference time set to 8');
        } else {
            this._referenceTime = t;
        }
    }

    private _referenceMagn: number;

    get referenceMagn(): number {
        return this._referenceMagn;
    }

    set referenceMagn(m: number) {
        if (isNaN(m)) {
            this._referenceMagn = 10.0;
            console.log('reference magnitude set to 10');
        } else {
            this._referenceMagn = m;
        }
    }

    private _atmExtinction: number;

    get atmExtinction(): number {
        return this._atmExtinction;
    }

    set atmExtinction(ae: number) {
        if (isNaN(ae)) {
            this._atmExtinction = 0.0;
            console.log('Atmospheric Extinction set to 8.0');
        } else {
            this._atmExtinction = ae;
        }
    }

    private _referenceFltr: string;

    get referenceFltr(): string {
        return this._referenceFltr;
    }

    set referenceFltr(f: string) {
        if (f === null) {
            this._referenceFltr = 'U';
            console.log('reference filter set to \'U\'');
        } else {
            this._referenceFltr = f;
        }
    }

    /* METHODS */
    calculate(filter: string, currentTime: number): number {
        const wavelength = filterWavelength;
        const eventTime = 0;//parseFloat(this.form["time"].value);
        const f = wavelength[filter];
        const f0 = wavelength[this.referenceFltr];
        const Rv = 3.1;

        const FZP0 = ZERO_POINT_VALUES[this.referenceFltr];
        const FZP = ZERO_POINT_VALUES[filter];
        const td = currentTime - eventTime;
        const Anu = calculateLambda(this.atmExtinction * Rv, wavelength[this.referenceFltr]);

        const eq1 = Math.log10(FZP0 / FZP);
        const eq2 = this.temporalIndex * Math.log10(td / this.referenceTime);
        const eq3 = this.spectralIndex * Math.log10(f / f0);
        const eq4 = Anu / 2.5;

        if (DEBUG) {
            console.log('Flux term: ', eq1);
            console.log('Time term: ', eq2);
            console.log('Frequency term: ', eq3);
            console.log('Extinction term: ', eq4);
            console.log('Combined: ', this.referenceMagn - 2.5 * (eq1 + eq2 + eq3 - eq4));
            console.log('-');
        }
        return this.referenceMagn - (2.5 * (eq1 + eq2 + eq3 - eq4));
    }

}


// algorithmic model
export class NonLinearRegression extends Model {
    xdata: Array<number> = [];
    ydata: Array<number> = [];
    filters: { [x: number]: string } = {};

    constructor(form: VariableLightCurveForm, data: any[], eventTime: number, range?: Array<number>) {
        super(form);

        if (!range) {
            range = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
        }

        for (let i = 0; i < data.length; i++) {
            // move this to main driver file. no need to do here.
            if (data[i][0] - eventTime > range[0] && data[i][0] - eventTime < range[1]) {
                this.xdata.push(data[i][0] - eventTime);
                this.ydata.push(data[i][1]);
                this.filters[(data[i][0] - eventTime)] = formatFilterName(data[i][2]);
            }
        }
    }

    async leastSquaresMethod() {
        return await this.LSMServerRequest();
    }

    /* METHODS */
    private parameters() {
        if (!this.xdata || !this.ydata) {
            console.log('Missing data');
            return {};
        }
        if (!this.filters) {
            console.log('Missing filters');
            return {};
        }
        if (!this.referenceFltr ||
            isNaN(this.referenceMagn) ||
            isNaN(this.referenceTime) ||
            isNaN(this.temporalIndex) ||
            isNaN(this.spectralIndex)) {
            console.log('Missing form parameter(s)');
            return {};
        }
        return {
            'xdata': this.xdata,
            'ydata': this.ydata,
            'filters': this.filters,
            'params': {
                'm': this.referenceMagn,
                'a': this.temporalIndex,
                'b': this.spectralIndex,
                't': this.referenceTime,
                'filter': this.referenceFltr,
            }
        };
    }

    private LMSFormUpdate(response: any) {
        const form = document
            .getElementById('transient-form') as VariableLightCurveForm;
        // text entries
        form['mag_num'].value = parseFloat(response['popt'][0]);
        form['a_num'].value = parseFloat(response['popt'][1]);
        form['b_num'].value = parseFloat(response['popt'][2]);
        // sliders
        form['mag'].value = parseFloat(response['popt'][0]);
        form['a'].value = parseFloat(response['popt'][1]);
        form['b'].value = parseFloat(response['popt'][2]);
    }

    private LSMServerRequest() {
        return new Promise(resolve => {
            let xmlhttp = new XMLHttpRequest;
            let url = baseUrl + "/transient";
            let updateForm = this.LMSFormUpdate;

            xmlhttp.onload = function () {
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                    let response = JSON.parse(xmlhttp.responseText);
                    updateForm(response);
                    resolve('success');
                } else {
                    resolve('failure');
                }
            }
            xmlhttp.open("POST", url, true);
            xmlhttp.setRequestHeader("Content-Type", "application/json");
            xmlhttp.send(JSON.stringify(this.parameters()));
        });
    }
}
