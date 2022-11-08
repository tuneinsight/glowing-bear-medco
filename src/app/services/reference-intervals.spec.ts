import { Interval } from './explore-statistics.service';
import { ReferenceIntervalComputer } from './reference-intervals';

describe('ReferenceInterval0', () => {

    let intervals: Interval[] = [
        {
            count: 1,
            lowerBound: '0',
            higherBound: '1'
        },
        {
            count: 1,
            lowerBound: '1',
            higherBound: '2'
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
        console.log(RI);
        expect(RI[0]).toBeDefined();
        expect(RI[1]).toBeDefined();
        expect(RI[0].lowerBound).toBe(0.5);
        expect(RI[0].higherBound).toBe(0.5);
        expect(RI[1].lowerBound).toBe(1.5);
        expect(RI[1].higherBound).toBe(1.5);
    });
});

describe('ReferenceInterval1', () => {

    let intervals: Interval[] = [
        {
            count: 1,
            lowerBound: '0',
            higherBound: '1'
        },
        {
            count: 200,
            lowerBound: '1',
            higherBound: '2'
        },
        {
            count: 500,
            lowerBound: '2',
            higherBound: '3'
        },
        {
            count: 600,
            lowerBound: '3',
            higherBound: '4'
        },
        {
            count: 500,
            lowerBound: '4',
            higherBound: '5'
        },
        {
            count: 10,
            lowerBound: '5',
            higherBound: '6'
        },
        {
            count: 2,
            lowerBound: '6',
            higherBound: '7'
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
        console.log(RI);
        expect(RI[0]).toBeDefined();
        expect(RI[1]).toBeDefined();
        expect(RI[0].lowerBound).toBe(1.5);
        expect(RI[0].higherBound).toBe(1.5);
        expect(RI[1].lowerBound).toBe(4.5);
        expect(RI[1].higherBound).toBe(4.5);
    });
});


describe('ReferenceInterval2', () => {

    let intervals: Interval[] = [
        {
            count: 0,
            lowerBound: '0',
            higherBound: '1'
        },
        {
            count: 2,
            lowerBound: '1',
            higherBound: '2'
        },
        {
            count: 50,
            lowerBound: '2',
            higherBound: '3'
        },
        {
            count: 100,
            lowerBound: '3',
            higherBound: '4'
        },
        {
            count: 5000,
            lowerBound: '4',
            higherBound: '5'
        },
        {
            count: 560,
            lowerBound: '5',
            higherBound: '6'
        },
        {
            count: 550,
            lowerBound: '6',
            higherBound: '7'
        },
        {
            count: 200,
            lowerBound: '7',
            higherBound: '8'
        },
        {
            count: 100,
            lowerBound: '8',
            higherBound: '9'
        },
        {
            count: 50,
            lowerBound: '9',
            higherBound: '10'
        },
        {
            count: 2,
            lowerBound: '10',
            higherBound: '11'
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
        console.log(RI);
        expect(RI[0]).toBeDefined();
        expect(RI[1]).toBeDefined();
        expect(RI[0].lowerBound).toBe(3.5);
        expect(RI[0].higherBound).toBe(4.5);
        expect(RI[1].lowerBound).toBe(7.5);
        expect(RI[1].higherBound).toBe(8.5);
    });
});
