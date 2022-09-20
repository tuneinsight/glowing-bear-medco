import { v4 as uuidv4 } from 'uuid';
import { Injectable, Output } from '@angular/core';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiI2b2Panel } from '../models/api-request-models/medco-node/api-i2b2-panel';
import { ApiI2b2Timing } from '../models/api-request-models/medco-node/api-i2b2-timing';
import { ApiExploreStatistics, ModifierApiObjet} from '../models/api-request-models/survival-analyis/api-explore-statistics';
import { ApiExploreStatisticResult, ApiExploreStatisticsResponse } from '../models/api-response-models/explore-statistics/explore-statistics-response';
import { CombinationConstraint } from '../models/constraint-models/combination-constraint';
import { Constraint } from '../models/constraint-models/constraint';
import { TreeNode } from '../models/tree-models/tree-node';
import { ErrorHelper } from '../utilities/error-helper';
import { ApiEndpointService } from './api-endpoint.service';
import { CohortService } from './cohort.service';
import { ConstraintMappingService } from './constraint-mapping.service';
import { ConstraintReverseMappingService } from './constraint-reverse-mapping.service';
import { ConstraintService } from './constraint.service';
import { CryptoService } from './crypto.service';
import { NavbarService } from './navbar.service';
import { QueryService } from './query.service';
import { AppConfig } from '../config/app.config';
import { ReferenceIntervalComputer } from './reference-intervals';
import { isCipherFormat } from 'src/app/utilities/is-cipher-format';
import { MessageHelper } from '../utilities/message-helper';

export class ConfidenceInterval {
    constructor(public readonly lowerBound: number, public readonly middle: number, public readonly higherBound: number) {
    }
}

// this class represents contains the following info: how many observations there are in a interval of a histogram for a concept
export class Interval {
    count: number
    higherBound: string
    lowerBound: string

    constructor(lowerBound: string, higherBound: string, decryptedCount: number) {
        this.higherBound = higherBound
        this.lowerBound = lowerBound
        this.count = decryptedCount
    }
}

class ReferenceRange {

    readonly CI1: ConfidenceInterval
    readonly CI2: ConfidenceInterval

    constructor(intervals: Interval[]) {
        const riComputer = new ReferenceIntervalComputer(intervals)
        const RI = riComputer.compute()

        this.CI1 = RI[0]
        this.CI2 = RI[1]
    }
}

// This class contains all information necessary to build a histogram chart with chart.js
export class ChartInformation {
    readonly intervals: Interval[]
    readonly unit: string
    readonly CI1: ConfidenceInterval
    readonly CI2: ConfidenceInterval
    readonly readable: Observable<any>

    readonly referenceRange: ReferenceRange


    constructor(intervals: Interval[], unit: string,
        public readonly treeNodeName: string, public readonly cohortName: string) {

        this.intervals = intervals
        this.unit = unit

        this.referenceRange = new ReferenceRange(intervals)

        this.CI1 = this.referenceRange.CI1
        this.CI2 = this.referenceRange.CI2
    }

    numberOfObservations(): number {
        return this.intervals.map(i => i.count).reduce((x1, x2) => x1 + x2)
    }

}

/*
* ExploreStatisticsService that communicates with the following two components: explore-statistics-settings, explore-statistics-results.
* From the settings given by the explore-statistics-settings form, this class is able to execute a
* query which will fetch the aggregated number of observations
* per interval for a specific concept. It communicates that info to explore-statistics-results which will display that histogram as a chart
*/
@Injectable({
    providedIn: 'root' // singleton service
})
export class ExploreStatisticsService {


    private static TIMEOUT_MS = 1000 * 60 * 1;

    // 1 minute timeout

    private _lastQueryTiming: ApiI2b2Timing;
    private _lastCohortDefinition: ApiI2b2Panel[] = []
    // Sends the result of the latest query when is is available
    @Output() chartsDataSubject: Subject<ChartInformation[]> = new ReplaySubject(1)

    // Emits whenever the explore statistics query has been launched.
    @Output() displayLoadingIcon: Subject<boolean> = new ReplaySubject(1)

    private _analytes: Array<TreeNode> = []

    // Emits whenever an export of the statistical results as a pdf document needs to be generated.
    exportPDF: Subject<any> = new Subject();

    // This observable emits the latest query's cohort inclusion criteria for the explore statistics query
    rootConstraint: Subject<CombinationConstraint> = new ReplaySubject(1)
    // This observable emits the latest explore statistics query set of analytes
    analytesSubject: Subject<Set<TreeNode>> = new ReplaySubject(1)

    private static getNewQueryID(): string {
        return uuidv4();
    }

    constructor(
        private config: AppConfig,
        private apiEndpointService: ApiEndpointService,
        private cryptoService: CryptoService,
        private constraintService: ConstraintService,
        private cohortService: CohortService,
        private queryService: QueryService,
        private constraintMappingService: ConstraintMappingService,
        private reverseConstraintMappingService: ConstraintReverseMappingService,
        private navbarService: NavbarService,
    ) {

    }




    // The panels returned by the constraint service have a tendency to be out of date. Use this method to refresh them.
    private refreshConstraint(constraint: CombinationConstraint): Observable<CombinationConstraint> {
        const i2b2Panels: ApiI2b2Panel[] = this.constraintMappingService.mapConstraint(constraint)

        if (i2b2Panels.length === 0) {
            /* Return an empty constraint if the passed parameter is empty.
            * This can happen if the exclusion criteria is empty for example.  */
            return of(new CombinationConstraint())
        }

        const mappedConstraint = this.reverseConstraintMappingService.mapPanels(i2b2Panels)

        return mappedConstraint.pipe(map(c => {
            if (c instanceof CombinationConstraint) {
                return c as CombinationConstraint
            }
            const comb = new CombinationConstraint()
            comb.addChild(c)
            return comb
        }))
    }


    /*
     * This function is called when the user wants to execute an explore statistics from the explore tab.
     * This function sends an explore statistics query to all running back-end nodes.
     * When the answer is received it is processed and transformed
     * into a list of chart informations. Each chart information is used to build a new chart in the front end.
     */
    executeQueryFromExplore(bucketSize: number, minObservation: number) {
        if (bucketSize === undefined || bucketSize <= 0) {
            bucketSize = 1 // TODO remove this when we'll have created the processus sharing the bucket size between servers
        }

        if (minObservation === undefined) {
            minObservation = 0 // TODO remove  when we'll have created the processus sharing the min observation between servers
        }


        this.processQuery(bucketSize, minObservation);


    }

    private processQuery(bucketSize: number, minObservations: number) {


        const uniqueAnalytes = new Set(this._analytes);
        this.analytesSubject.next(uniqueAnalytes)


        const cohortConstraint = this.constraintService.generateConstraint();

        this.refreshConstraint(this.constraintService.generateConstraint()).subscribe(refreshed => {
            /* There are problems with the current version of the code. Hence it is necessary to use
            * the hackish method refreshConstraint so that the summary of the used constraints is up to date.
            * If a user replaces a concept with another by dropping the selected concept on the
            * previously selected concept in the explore statistics form, the newer concept wont be displayed
            * in the summary of the query. The newer concept will still be sent to the backend because
            * mapConstraint will returned the latest up to date i2b2 tree.
            */
            this.rootConstraint.next(refreshed)
        })

        const analytes = Array.from(uniqueAnalytes);

        if (analytes.length === 0) {
            this.queryService.isUpdating = false
            this.displayLoadingIcon.next(false)
            throw ErrorHelper.handleNewUserInputError('No analytes have been specified (numerical medical concepts).');
        }

        // the analytes split into two groups: modifiers and concepts
        const { modifiers } = this.extractConceptsAndModifiers(analytes);

        this._lastCohortDefinition = this.constraintMappingService.mapConstraint(cohortConstraint)
        this._lastQueryTiming = this.queryService.lastTiming


        const panelEmpty = cohortConstraint === undefined || (
            (cohortConstraint instanceof CombinationConstraint) && (cohortConstraint as CombinationConstraint).children.length === 0
        )

        const apiRequest: ApiExploreStatistics = {
            id: ExploreStatisticsService.getNewQueryID(),
            analytes: [...modifiers],
            userPublicKey: this.cryptoService.ephemeralPublicKey,
            bucketSize,
            minObservations,
            panels: this._lastCohortDefinition,
            isPanelEmpty: panelEmpty
        };

        this.displayLoadingIcon.next(true);

        const observableRequest = this.sendRequest(apiRequest);

        this.navbarService.navigateToExploreStatisticsTab();

        observableRequest.subscribe((answers: ApiExploreStatisticsResponse[]) => {
            this.handleAnswer(answers, cohortConstraint);

        }, err => {
            if (err.error === undefined) {
                ErrorHelper.handleNewError('An error occurred during the request execution.')
            } else {
                ErrorHelper.handleNewError(err.error.message)
            }
            this.displayLoadingIcon.next(false);
        });
    }

    private handleAnswer(answers: ApiExploreStatisticsResponse[], cohortConstraint: Constraint) {
        if (answers === undefined || answers.length === 0) {
            throw ErrorHelper.handleNewError('Empty server response. Empty result in explore-statistics.');
        }

        // query IDs of the cohort built from the constraints and saved in the backend nodes' DB
        const patientQueryIDs = answers.map(a => a.cohortQueryID);
        this.cohortService.lastSuccessfulSet = patientQueryIDs

        // All servers are supposed to send the same information so we pick the element with index zero
        const serverResponse = answers[0];

        if (serverResponse.results === undefined || serverResponse.results === null) {
            this.displayLoadingIcon.next(false);
            throw ErrorHelper.handleNewError('Empty server response. Please verify you selected an analyte.');
        }

        const chartsInformations =
            serverResponse.results.reduce((responseResult, result: ApiExploreStatisticResult) => {
                const intervals = result.intervals.reduce((intervalsResult, i) => {
                        return [ ...intervalsResult, new Interval(i.lowerBound, i.higherBound, i.count) ];
                    }, []
                );

                const newChartInformation = new ChartInformation(
                    intervals,
                    result.unit,
                    result.analyteName,
                    cohortConstraint.textRepresentation);

                if (newChartInformation.numberOfObservations() > 0) {
                    return [
                        ...responseResult,
                        newChartInformation
                    ];
                } else {
                    MessageHelper.alert('info', `0 observations for the ${result.analyteName} analyte.`);
                    return responseResult;
                }
            }, []);


        if (chartsInformations.length) {
            // waiting for the intervals to be decrypted by the crypto service to emit the chart information to external listeners.
            this.chartsDataSubject.next(chartsInformations);
        }
        this.displayLoadingIcon.next(false);
    }

    private sendRequest(apiRequest: ApiExploreStatistics): Observable<ApiExploreStatisticsResponse[]> {
        const publicKey = this.cryptoService.ephemeralPublicKey;

        return this.apiEndpointService.postCall(
            `projects/${this.config.projectId}/datasource/query`,
            {
              operation: 'statisticsQuery',
              aggregationType: 'aggregated',
              broadcast: true,
              outputDataObjectsNames: Object.keys(this._analytes),
              parameters: apiRequest,
              targetPublicKey: publicKey
            }
          )
          .pipe(
              map((exploreStatsResponse) => {
                  const resultsArr = Object.values(exploreStatsResponse.results);

                  const formattedResults = resultsArr.map((value: any, index) => {
                      if (value.type === 'ciphertable') {
                        const valueInUint8 = this.cryptoService.decodeBase64Url(value.value) as Uint8Array;
                        const decryptedValue = this.cryptoService.decryptCipherTable(valueInUint8);
                        if (isCipherFormat(decryptedValue)) {
                            value.data = decryptedValue.data;
                        }
                        value.type = 'floatMatrix';
                      }
                      return {
                          analyteName: this._analytes[index].displayName,
                          intervals: value.data[0].map((dataValue, dataIndex) => {
                              const bounds = JSON.parse(value.columns[dataIndex]);
                              return {
                                  count: Math.abs(Math.round(dataValue)),
                                  lowerBound : `${bounds[0]}.00000`,
                                  higherBound: `${bounds[1]}.00000`
                                };
                          }),
                          unit: ' test value 2',
                          timers: []
                        };
                  });

                  return [{
                      globalTimers: [],
                      results: formattedResults,
                      cohortQueryID: 0,
                      patientSetID: 0
                    }];
                })
            )
    }

    private extractConceptsAndModifiers(analytes: TreeNode[]) {
        const conceptsPaths = analytes
            .filter(node => !node.isModifier)
            .map(node => node.path);




        const modifiers: ModifierApiObjet[] = analytes.filter(node => node.isModifier()).map(node => {
            return {
                queryTerm: node.appliedConcept.path,
                modifier: {
                    appliedPath: node.appliedConcept.path,
                    key: node.path
                }
            };
        });


        return { conceptsPaths, modifiers };
    }




    public set analytes(analytes: TreeNode[]) {
        this._analytes = analytes
    }

    public get analytes(): TreeNode[] {
        return this._analytes.map(t => t.clone(undefined, false, true))
    }

    saveCohortStatistics() {
        this.rootConstraint.subscribe(
            rootConstraint => {
                const cohort = this.lastCohortDefinition
                const timing = this.lastQueryTiming
                this.cohortService.saveCohort(rootConstraint, cohort, timing)
            })
    }

    // send a signal that launches the export of the statistical results as a PDF
    sendExportAsPDFSignal() {
        if (!this.navbarService.isExploreStatistics) {
            throw ErrorHelper.handleNewError('Cannot export the PDF outside of the statistics tab.');
        }

        this.exportPDF.next(1)
    }

    get lastCohortDefinition(): ApiI2b2Panel[] {
        return this._lastCohortDefinition
    }

    get lastQueryTiming(): ApiI2b2Timing {
        return this._lastQueryTiming
    }

}
