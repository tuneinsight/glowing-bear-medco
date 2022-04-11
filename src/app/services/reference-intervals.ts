import { ErrorHelper } from "../utilities/error-helper";
import { ConfidenceInterval, Interval } from "./explore-statistics.service";


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
    private intervals: NumericInterval[]

    private _binWidth: number

    constructor(intervals: Interval[]) {
        this.intervals = intervals.map(i => new NumericInterval(i))
        this.calcBinWidth()
    }


    private calcBinWidth() {
        if (this.intervals.length <= 0) {
            throw ErrorHelper.handleNewError("Empty data impossible to compute the bin width")
        }

        const first = this.intervals[0]
        this._binWidth = first.higherBound - first.lowerBound
    }

    public get binWidth() {
        return this._binWidth
    }


    // Input: Vector of the counts per bin
    // Output: Vector of the density per bin
    private calculateDensity(): number[] {
        // Calculate the total sum of all bins (add all counts).
        const totalCount = this.intervals.reduce((sum, i) => sum + i.count, 0)

        return this.intervals.map(i => i.count / totalCount)
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
        return this.intervals.flatMap(i => {
            return Array(i.count).fill(i.lowerBound + this._binWidth / 2)
        })
    }

    // https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
    private static getRandomSubarray<T>(arr: T[], size: number) {

        let shuffled = arr.slice(0);
        let i = arr.length;
        let temp: T;
        let index: number;

        while (i--) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }

        return shuffled.slice(0, size);
    }


    static bootstrapReferenceInterval(fullData: number[], sampleSize = 240,
        bootR = 5000, percentileLow = 0.025, percentileHigh = 0.975): Bootstrapping {
        const riLow = []
        const riHigh = []

        if (sampleSize > fullData.length) {
            sampleSize = fullData.length
        }


        const riLowIndex = Math.floor(sampleSize * percentileLow)
        const riHighIndex = Math.floor(sampleSize * percentileHigh)


        let i = 0
        while (i <= bootR) {
            const bootSample = ReferenceIntervalComputer.getRandomSubarray(fullData, sampleSize)

            this.sortAscending(bootSample)
            riLow.push(bootSample[riLowIndex])

            riHigh.push(bootSample[riHighIndex])

            i++
        }


        return new Bootstrapping(riLow, riHigh)
    }

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
            throw ErrorHelper.handleNewError("empty array passed as input to mean function")
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



    compute(): [ConfidenceInterval, ConfidenceInterval] {
        const fullData = this.recreateData()
        const bootstrapping = ReferenceIntervalComputer.bootstrapReferenceInterval(fullData)
        const CILow = ReferenceIntervalComputer.calcBootRI(bootstrapping.RILow)
        const CIHigh = ReferenceIntervalComputer.calcBootRI(bootstrapping.RIHigh)
        console.log("Computed RI: ", CILow, CIHigh)
        return [CILow, CIHigh]
    }

}

class Bootstrapping {
    constructor(public readonly RILow: number[], public readonly RIHigh: number[]) { }
}

