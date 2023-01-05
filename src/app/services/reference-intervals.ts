import { ErrorHelper } from '../utilities/error-helper';
import { ConfidenceInterval, Interval } from './explore-statistics.service';


class NumericInterval {
    count: number
    higherBound: number
    lowerBound: number

    constructor(interval: Interval) {
        this.higherBound = parseFloat(interval.higherBound)
        this.lowerBound = parseFloat(interval.lowerBound)
        this.count = interval.count
    }
}

export class ReferenceIntervalComputer {

    public get binWidth() {
        return this._binWidth
    }
    private intervals: NumericInterval[]

    private _binWidth: number
    private _bootR: number
    private _minBootSampleSize: number
    private _maxBootSampleSize: number
    private _percentileLow: number
    private _percentileHigh: number


    static sortAscending(arr: number[]) {
        arr.sort((x, y) => x - y)
    }

    static quantile(data: number[], qLow: number = .05, qHigh: number = .95): [number, number] {
        const copy = data.map(x => x)
        this.sortAscending(copy)

        const placeLow = Math.floor(qLow * copy.length)
        const placeHigh = Math.floor(qHigh * copy.length)

        return [copy[placeLow], copy[placeHigh]]
    }

    static mean(arr: number[]) {
        if (arr.length <= 0) {
            throw ErrorHelper.handleNewError('empty array passed as input to mean function')
        }

        return arr.reduce((s, x) => s + x, 0) / arr.length
    }


    // Calculate the RI (+ CI) from the bootstrapping
    private static calcBootRI(RI: number[]): ConfidenceInterval {

        // The mean of the bootstrapped sample is the "sample mean"
        // the mean of the 2.5 percentile
        const RIMean = ReferenceIntervalComputer.mean(RI)
        const [CILow, CIHigh] = ReferenceIntervalComputer.quantile(RI)
        return new ConfidenceInterval(CILow, RIMean, CIHigh)

    }

    // getRandomHist returns a random histogram of the same distribution as the original histogram
    private getRandomHist(arr: number[], sampleSize: number, histLength: number): number[] {

        let sampled = new Array(histLength).fill(0); // Initialized to 0
        for (let i = 0; i < sampleSize; i++) {
            const sampleIndex = arr[Math.floor(Math.random() * arr.length)]
            sampled[sampleIndex]++;
        }

        return sampled;
    }

    bootstrapReferenceInterval(fullData: number[], minSampleSize = 240, maxSampleSize = -1,
        bootR = 1000, percentileLow = 0.025, percentileHigh = 0.975): Bootstrapping {
        const riLow = []
        const riHigh = []

        let sampleSize = minSampleSize
        if (fullData.length > minSampleSize) {
            sampleSize = fullData.length
        }
        if (maxSampleSize > 0 && sampleSize > maxSampleSize) {
            sampleSize = maxSampleSize
        }

        const riLowIndex = Math.floor(sampleSize * percentileLow)
        const riHighIndex = Math.floor(sampleSize * percentileHigh)

        let i = 0
        while (i <= bootR) {
            const bootSample = this.getRandomHist(fullData, sampleSize, this.intervals.length)
            let cumulSum = bootSample[0]
            let k = 0
            while (riLowIndex >= cumulSum) {
                cumulSum += bootSample[++k]
            }
            riLow.push((this.intervals[k].lowerBound + this._binWidth / 2))

            cumulSum = sampleSize - bootSample[bootSample.length - 1]
            k = this.intervals.length - 1
            while (riHighIndex < cumulSum) {
                cumulSum -= bootSample[--k]
            }
            riHigh.push((this.intervals[k].lowerBound + this._binWidth / 2))

            i++
        }

        return new Bootstrapping(riLow, riHigh)
    }

    constructor(intervals: Interval[],
        bootR = 1000,
        minBootSampleSize = 240,
        maxBootSampleSize = -1,
        percentileLow = 0.025,
        percentileHigh = 0.975
    ) {
        this.intervals = intervals.map(i => new NumericInterval(i))
        this._bootR = bootR
        this._minBootSampleSize = minBootSampleSize
        this._maxBootSampleSize = maxBootSampleSize
        this._percentileLow = percentileLow
        this._percentileHigh = percentileHigh
        this.calcBinWidth()
    }


    private calcBinWidth() {
        if (this.intervals.length <= 0) {
            throw ErrorHelper.handleNewError('Empty data impossible to compute the bin width')
        }

        const first = this.intervals[0]
        this._binWidth = first.higherBound - first.lowerBound
    }

    /*
    * Implementing a very basic bootstrapping technique using the recreated data set. We recreate the data set
    * by creating new data points with the value of each Bin Mids and the amount specified in the count variable.
    *  Input: Frequency table
    *  Output: Data vector
    */
    recreateData(): number[] {
        /*
        * given intervals = { lowerBound = [2, 3, 4, 5], count = [4, 2, 0, 1]},
        * binWidth = 1 it will return [2, 2, 2, 2, 3, 3, 5] + .5 =  [2.5, 2.5, 2.5, 2.5, 3.5, 3.5, 5.5]
        */
        // @ts-ignore
        return this.intervals.flatMap(i => {
            return Array(i.count).fill(i.lowerBound + this._binWidth / 2)
        })
    }

    helperVector(): number[] {
        /*
        * given intervals = { lowerBound = [2, 3, 4, 5], count = [4, 2, 0, 1]},
        * binWidth = 1 it will return [2, 2, 2, 2, 3, 3, 5] + .5 =  [2.5, 2.5, 2.5, 2.5, 3.5, 3.5, 5.5]
        */
       // @ts-ignore
       return this.intervals.flatMap((i, ind) => {
            return Array(i.count).fill(ind)
        })
    }


    compute(): [ConfidenceInterval, ConfidenceInterval] {
        const fullData = this.helperVector()
        const bootstrapping = this.bootstrapReferenceInterval(
            fullData,
            this._minBootSampleSize,
            this._maxBootSampleSize,
            this._bootR,
            this._percentileLow,
            this._percentileHigh
        )

        const CILow = ReferenceIntervalComputer.calcBootRI(bootstrapping.RILow)
        const CIHigh = ReferenceIntervalComputer.calcBootRI(bootstrapping.RIHigh)
        return [CILow, CIHigh]
    }

}

class Bootstrapping {
    constructor(public readonly RILow: number[], public readonly RIHigh: number[]) { }
}

