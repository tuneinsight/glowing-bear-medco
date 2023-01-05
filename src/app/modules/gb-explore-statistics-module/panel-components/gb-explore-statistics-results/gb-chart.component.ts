
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartOptions, ChartType, ScriptableLineSegmentContext } from 'chart.js';
import { PDF } from 'src/app/utilities/files/pdf';
import { ChartInformation, ConfidenceInterval } from '../../../../services/explore-statistics.service';
import { SVGConvertible } from './gb-explore-statistics-results.component';



const childFlexCss = './child-flex.css'
const resultsCss = './gb-explore-statistics-results.component.css'

const chartSelector = 'gb-explore-stats-canvas'
const chartTemplate = `
  <div>
    <canvas #canvasElement>{{chart}}</canvas>
  </div>
  `

// See for reference how to use canvas in angular:  https://stackoverflow.com/questions/44426939/how-to-use-canvas-in-angular
export abstract class ChartComponent implements AfterViewInit, OnDestroy, SVGConvertible {
    private static BACKGROUND_COLOURS: string[] = [
        'rgba(68, 0, 203, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 99, 132, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(255, 159, 64, 0.5)']


    @ViewChild('canvasElement', { static: false })
    private canvasRef: ElementRef<HTMLCanvasElement>;

    protected chartJSType: ChartType

    chartInfo: ChartInformation

    chart: Chart


    // the colour is chosen in BACKGROUND_COLOURS modulo the length of BACKGROUND_COLOURS
    static getBackgroundColor(index: number): string {
        return ChartComponent.BACKGROUND_COLOURS[index % ChartComponent.BACKGROUND_COLOURS.length]
    }

    constructor(public element: ElementRef, chartJSType: ChartType) {
        this.chartJSType = chartJSType
    }

    printToPDF(pdf: PDF, columnIndex: number) {
        console.log('Exporting chart to PDF')
        const exportedChart = this.canvasRef.nativeElement.toDataURL('image/svg', 'high')
        const height = this.canvasRef.nativeElement.height
        const width = this.canvasRef.nativeElement.width

        const imgRatio = height / width


        const finalWidth = pdf.getColumnWidth()
        const imgHeight = imgRatio * finalWidth

        // todo add parameter that orders is element is last in row.
        pdf.addImageFromDataURL(exportedChart, 0, 0, finalWidth, imgHeight, columnIndex)

    }



    ngAfterViewInit(): void {

        // TODO debug: ExpressionChangedAfterItHasBeenCheckedError (maybe use angular chart js?)
        // the reference to the `canvas` on which the chart will be drawn. See the @Component to see the canvas.
        const context = this.canvasRef.nativeElement.getContext('2d');
        /* this.chart = */ this.draw(context)
        // this.chart.update()
    }

    abstract draw(context: CanvasRenderingContext2D);

    ngOnDestroy() {
    }


}

@Component({
    selector: chartSelector,
    template: chartTemplate,
    styleUrls: [resultsCss, childFlexCss],
})
export class HistogramChartComponent extends ChartComponent {


    constructor(public element: ElementRef) {
        super(element, 'bar')
    }

    ngAfterViewInit() {
        super.ngAfterViewInit()
    }

    /*
    * Given ChartInformation object this function will draw the histogram on the canvas
    */
    draw(context: CanvasRenderingContext2D): Chart {

        if (!(this.chartInfo && this.chartInfo.intervals && this.chartInfo.intervals.length > 0)) {

            return new Chart(context,
                {
                    type: this.chartJSType,
                    data: {
                        datasets: []
                    }
                }
            )

        }

        // When the interval is the last one the right bound is inclusive, otherwise it is exclusive.
        const getRightBound = (i: number) => i < (this.chartInfo.intervals.length - 1) ? '[' : ']'

        const labels = this.chartInfo.intervals.map((int, i) => {
            return '[ ' + parseFloat(int.lowerBound) + ', ' + parseFloat(int.higherBound) + ' ' + getRightBound(i)
        })
        const data = {
            labels,
            datasets: [{
                data: this.chartInfo.intervals.map(i => i.count),
                backgroundColor: ChartComponent.getBackgroundColor(0)
            }]
        }



        return new Chart(context,
            {
                type: this.chartJSType,
                data,
                options: this.buildHistogramOptions(),
            }
        );


    }


    private findMinDisplayed() {
        let min, max: number;
        max = this.chartInfo.intervals[0].count;
        min = max;

        this.chartInfo.intervals.forEach(v => {
            if (max < v.count) {
                max = v.count;
            }
            if (min > v.count) {
                min = v.count;
            }
        });

        // the minimum value displayed by the chart is defined as the minimum data point minus 10% the range of values (max - min)
        const minDisplayed = min === 0 ? 0 : Math.floor(min - (max - min) * .1);
        return minDisplayed;
    }

    private buildHistogramOptions(): ChartOptions {


        return {
            plugins: {
                title: {
                    text: 'Histogram for the `' + this.chartInfo.treeNodeName + '` analyte',
                    display: true
                },
                legend: {
                    display: true,
                },
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: this.chartInfo.treeNodeName + ' [' + this.chartInfo.unit + ']'
                    },
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Frequency'
                    },
                    suggestedMin: this.findMinDisplayed()
                }
            }
        };
    }
}

@Component({
    selector: chartSelector,
    template: chartTemplate,
    styleUrls: [resultsCss, childFlexCss],
})

export class LineChartComponent extends ChartComponent {
    private CI1: ConfidenceInterval
    private CI2: ConfidenceInterval

    constructor(public element: ElementRef) {
        super(element, 'line')
    }

    ngAfterViewInit() {
        super.ngAfterViewInit()
    }

    // buildPoints  processes the dataset necessary for drawing the interpolated line graph
    private buildPoints(chartInfo: ChartInformation): any {
        // the x axis points associated to an interval count will be the the middle between the higher and lower bound of an interval
        const xValues: Array<number> = chartInfo.intervals.map(interval => {
            return (parseFloat(interval.higherBound) + parseFloat(interval.lowerBound)) / 2
        })

        const yValues: Array<number> = chartInfo.intervals.map(interval => interval.count)

        this.CI1 = chartInfo.CI1
        this.CI2 = chartInfo.CI2


        const _this = this

        function inExtremes(x: number): boolean {
            return x < _this.CI1.lowerBound || x > _this.CI2.higherBound
        }

        function inConfidenceInterval(x: number): boolean {
            return (x >= _this.CI1.lowerBound && x <= _this.CI1.higherBound) || (x >= _this.CI2.lowerBound && x <= _this.CI2.higherBound);
        }


        const extremeColour = 'rgb(234, 235, 236)' // light gray
        const CIColour = 'rgb(166, 225, 250)' // light blue
        const centerColour = 'rgb(24, 141, 210)' // dark blue

        function color(x: number): string {
            if (inExtremes(x)) {
                return extremeColour
            }

            if (inConfidenceInterval(x)) {
                return CIColour
            }

            return centerColour
        }


        const segmentColour = (ctx: ScriptableLineSegmentContext) => {
            // the index of the current data point
            const currentIndex = ctx.p0.parsed.x
            // is the index of the current point within the first confidence interval or the second confidence interval
            return color(currentIndex)
        }


        function createDataset(keep: ((x: number) => boolean)) {
            return yValues.flatMap((y, i) => {
                const x = xValues[i]
                if (keep(x)) {
                    return { x: x, y: y }
                }
                return []
            })
        }

        const extremeData = createDataset(inExtremes)
        const confidenceIntervalData = createDataset(x => !inExtremes(x) && inConfidenceInterval(x))
        const centerData = createDataset(x => !inExtremes(x) && !inConfidenceInterval(x))


        return {
            labels: xValues,
            datasets: [
                {
                    label: 'frequency', // Filtered out by the legend plugin
                    data: yValues,
                    borderColor: ChartComponent.getBackgroundColor(0),
                    fill: {
                        target: 1,
                        above: 'rgb(255, 0, 0)' // color of the fill above the origin
                    },
                    cubicInterpolationMode: 'monotone',
                    segment: {
                        borderColor: segmentColour
                    }
                },
                {
                    label: 'extreme data',
                    data: extremeData,
                    grouped: false,
                    type: 'bar',
                    backgroundColor: extremeColour,

                },
                {
                    label: 'confidence interval',
                    data: confidenceIntervalData,
                    grouped: false,
                    type: 'bar',
                    backgroundColor: CIColour,
                },
                {
                    label: 'frequency', // Filtered out by the legend plugin
                    data: centerData,
                    grouped: false,
                    type: 'bar',
                    backgroundColor: centerColour,
                }
            ]
        };


    }

    // this method builds the config necessary for drawing the interpolated line graph
    private buildInterpolatedConfig(data: ChartData): ChartConfiguration {


        let xUnit = ''
        if (this.chartInfo.unit) {
            xUnit = ' [' + this.chartInfo.unit + ']'
        }

        return {
            type: this.chartJSType,
            data: data,
            options: {
                aspectRatio: 1.5,
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Interpolated line plot for the `' + this.chartInfo.treeNodeName + '` analyte',
                    },
                    legend: {
                        labels: {
                            filter: (l) => (l.text !== 'frequency' && l.text !== '')
                        }
                    },
                },
                interaction: {
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: this.chartInfo.treeNodeName + xUnit,
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Frequency',
                        }
                    },
                },
            },
        };
    }


    /*
    * Given ChartInformation object this function will a line graph on the canvas.
    * The points of the curves are interconnected using interpolation methods
    * see for reference https://github.com/chartjs/Chart.js/blob/master/docs/samples/line/interpolation.md
    */
    draw(context: CanvasRenderingContext2D): Chart {
        const chartInfoAvailable = this.chartInfo && this.chartInfo.intervals && this.chartInfo.intervals.length > 0
        if (!chartInfoAvailable) {
            const chartData = {
                datasets: []
            }
            return new Chart(context, { type: this.chartJSType, data: chartData, })

        }

        const data = this.buildPoints(this.chartInfo)

        const config = this.buildInterpolatedConfig(data) as any

        config.options.plugins.annotation = {
            annotations: {
                CI1LowerBound: this.verticalDashLineConfig(this.CI1.lowerBound),
                CI1Middle: this.verticalLineConfig(this.CI1.middle),
                CI1HigherBound: this.verticalDashLineConfig(this.CI1.higherBound),

                CI2LowerBound: this.verticalDashLineConfig(this.CI2.lowerBound),
                CI2Middle: this.verticalLineConfig(this.CI2.middle),
                CI2HigherBound: this.verticalDashLineConfig(this.CI2.higherBound),
            }
        };




        return new Chart(context, config)

    }

    private verticalLineConfig(refIntervalX: unknown) {
        return {
            type: 'line',
            xMin: refIntervalX,
            xMax: refIntervalX,
            borderColor: 'rgb(24, 141, 210)'
        }
    }

    private verticalDashLineConfig(refIntervalX: unknown) {
        return {
            type: 'line',
            xMin: refIntervalX,
            xMax: refIntervalX,
            borderColor: 'rgb(166, 225, 250)',
            borderDash: [5, 15],
        };
    }
}
