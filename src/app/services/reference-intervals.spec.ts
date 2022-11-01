import { Interval } from './explore-statistics.service';
import { ReferenceIntervalComputer } from './reference-intervals';

describe('ReferenceInterval', () => {

    let intervals: Interval[] = [
        {
            count: 1000,
            lowerBound: '0',
            higherBound: '1'
        },
        {
            count: 2000,
            lowerBound: '1',
            higherBound: '2'
        },
        {
            count: 5000,
            lowerBound: '2',
            higherBound: '3'
        }
    ];

    const bootR = 1000
    const minSampleSize = 240
    const maxSampleSize = -1
    const percentileLow = 0.025
    const percentileHigh = 0.975

    const riComputer = new ReferenceIntervalComputer(
        intervals,
        bootR,
        minSampleSize,
        maxSampleSize,
        percentileLow,
        percentileHigh
        )

    it('should run the new bootstrapping method', () => {
        let start = new Date().getTime();
        let RI = riComputer.compute()
        let end = new Date().getTime();
        console.log('Time to create ref interval computer: ' + (end - start) + 'ms');
        expect(RI[0]).toBeDefined();
        expect(RI[1]).toBeDefined();
        console.log(RI);
    });
    it('should run the old bootstrapping method', () => {

        let start = new Date().getTime();
        let RI = riComputer.compute_old()
        let end = new Date().getTime();
        console.log('Time to create ref interval computer with old method: ' + (end - start) + 'ms');
        expect(RI[0]).toBeDefined();
        expect(RI[1]).toBeDefined();
        console.log(RI);
    });
});
