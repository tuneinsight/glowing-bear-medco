import { v4 as uuidv4 } from 'uuid';
import { Injectable, Output } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { forkJoin, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { ApiI2b2Panel } from '../models/api-request-models/medco-node/api-i2b2-panel';
import { ApiI2b2Timing } from '../models/api-request-models/medco-node/api-i2b2-timing';
import { ApiExploreStatistics, ModifierApiObjet } from '../models/api-request-models/survival-analyis/api-explore-statistics';
import { ApiExploreStatisticResult, ApiExploreStatisticsResponse, ApiInterval } from '../models/api-response-models/explore-statistics/explore-statistics-response';
import { ApiNodeMetadata } from '../models/api-response-models/medco-network/api-node-metadata';
import { ApiExploreQueryResult } from '../models/api-response-models/medco-node/api-explore-query-result';
import { CombinationConstraint } from '../models/constraint-models/combination-constraint';
import { Constraint } from '../models/constraint-models/constraint';
import { ExploreQueryResult } from '../models/query-models/explore-query-result';
import { ExploreQueryType } from '../models/query-models/explore-query-type';
import { TreeNode } from '../models/tree-models/tree-node';
import { ConstraintHelper } from '../utilities/constraint-utilities/constraint-helper';
import { ErrorHelper } from '../utilities/error-helper';
import { PDF } from '../utilities/files/pdf';
import { ApiEndpointService } from './api-endpoint.service';
import { MedcoNetworkService } from './api/medco-network.service';
import { CohortService } from './cohort.service';
import { ConstraintMappingService } from './constraint-mapping.service';
import { ConstraintReverseMappingService } from './constraint-reverse-mapping.service';
import { ConstraintService } from './constraint.service';
import { CryptoService } from './crypto.service';
import { NavbarService } from './navbar.service';
import { QueryService } from './query.service';
import { AppConfig } from '../config/app.config';
import { ExploreQueryService } from './api/medco-node/explore-query.service';

export class ConfidenceInterval {
    constructor(private _lowerBound: number, private _middle: number, private _higherBound: number) {
    }

    get lowerBound() {
        return this._lowerBound
    }

    get middle() {
        return this._middle
    }

    get higherBound() {
        return this._higherBound
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
        // TODO put Upal's code: replace the arbitrary values 1,2,3
        this.CI1 = new ConfidenceInterval(1, 2, 3)
        this.CI2 = new ConfidenceInterval(4, 5, 6)
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
    private _lastCohortDefintion: ApiI2b2Panel[] = []
    // Sends the result of the latest query when is is available
    @Output() chartsDataSubject: Subject<ChartInformation[]> = new ReplaySubject(1)

    // Emits whenever the explore statitistics query has been launched.
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
        private medcoNetworkService: MedcoNetworkService,
        private constraintService: ConstraintService,
        private cohortService: CohortService,
        private queryService: QueryService,
        private exploreQueryService: ExploreQueryService,
        private constraintMappingService: ConstraintMappingService,
        private reverseConstraintMappingService: ConstraintReverseMappingService,
        private navbarService: NavbarService,
        private keycloakService: KeycloakService
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
     *  When the answer is received it is processed and transformed
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

    /*the explore statistics servers answers contains the patient list for the cohort
    * and the count per site in case the user is authorized to see such information
    */
    private parseCohortFromAnswer(answers: ApiExploreStatisticsResponse[]) {

        if (this.queryService.queryType !== ExploreQueryType.PATIENT_LIST) {
            throw ErrorHelper.handleNewError('Unable parse the cohort content of the statistics query. User is not authorized to see the patient list.')
        }
        const nodes: ApiNodeMetadata[] = this.medcoNetworkService.nodes
        const exploreResults: ApiExploreQueryResult[] = answers.map(statAnswer => {
            const exploreResult = new ApiExploreQueryResult()
            exploreResult.status = 'available'
            exploreResult.encryptedPatientList = statAnswer.encryptedPatientList
            exploreResult.queryID = statAnswer.cohortQueryID
            exploreResult.encryptedCount = statAnswer.encryptedCohortCount

            return exploreResult
        })

        if (nodes.length !== exploreResults.length) {
            throw ErrorHelper.handleNewError('Different number of server nodes and server responses received')
        }

        const zipped: [ApiNodeMetadata, ApiExploreQueryResult][] = []
        for (let i = 0; i < nodes.length; i++) {
            zipped.push([nodes[i], exploreResults[i]])
        }


        const resultObserver = this.queryService.getExploreResultObserver()
        this.queryService.parseExploreQueryResults(zipped).subscribe(resultObserver)
    }


    private processQuery(bucketSize: number, minObservations: number) {


        const uniqueAnalytes = new Set(this._analytes);
        console.log('Analytes ', uniqueAnalytes);
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
            throw ErrorHelper.handleNewError('No analytes have been specified (numerical medical concepts). The value returned by the request will be the reference interval for the specified analytes.');
        }

        // the analytes split into two groups: modifiers and concepts
        const { conceptsPaths, modifiers }/*: { conceptsPaths: string[]; modifiers: ModifierApiObjet[]; }*/ =
            this.extractConceptsAndModifiers(analytes);

        this._lastCohortDefintion = this.constraintMappingService.mapConstraint(cohortConstraint)
        this._lastQueryTiming = this.queryService.lastTiming


        const panelEmpty = cohortConstraint === undefined || (
            (cohortConstraint instanceof CombinationConstraint) && (cohortConstraint as CombinationConstraint).children.length === 0
        )

        const apiRequest/*: ApiExploreStatistics*/ = {
            id: ExploreStatisticsService.getNewQueryID(),
            //concepts: conceptsPaths,
            analytes: [...modifiers],
//            modifiers: modifiers,
            userPublicKey: this.cryptoService.ephemeralPublicKey,
            bucketSize,
            minObservations,
            //timing: this._lastQueryTiming,
            panels: this._lastCohortDefintion,
            isPanelEmpty: panelEmpty
        };

        this.displayLoadingIcon.next(true);

        const observableRequest = this.sendRequest(apiRequest as any);

        console.log('observableRequest', observableRequest);

        this.navbarService.navigateToExploreTab();
        console.log('Api request ', apiRequest);

        observableRequest.subscribe((answers: ApiExploreStatisticsResponse[]) => {
            this.handleAnswer(answers, cohortConstraint);

        }, err => {
            if (err.error === undefined) {
                ErrorHelper.handleNewError('An unknown error occured during the request execution.')
            } else {
                ErrorHelper.handleNewError(err.error.message)
            }
            this.displayLoadingIcon.next(false);
        });
    }




    private handleAnswer(answers: ApiExploreStatisticsResponse[], cohortConstraint: Constraint) {
        if (answers === undefined || answers.length === 0) {
            throw ErrorHelper.handleNewError('Error with the servers. Empty result in explore-statistics.');
        }

        if (this.queryService.queryType === ExploreQueryType.PATIENT_LIST) {
            this.parseCohortFromAnswer(answers);
        }


        // query IDs of the cohort built from the constraints and saved in the backend nodes' DB
        const patientQueryIDs = answers.map(a => a.cohortQueryID);
        this.cohortService.lastSuccessfulSet = patientQueryIDs

        // All servers are supposed to send the same information so we pick the element with index zero
        const serverResponse: ApiExploreStatisticsResponse = answers[0];


        if (serverResponse.results === undefined || serverResponse.results === null) {
            this.displayLoadingIcon.next(false);
            throw ErrorHelper.handleNewError('Empty server response. Please verify you selected an analyte.');
        }

        const chartsInformationsObservables: Observable<ChartInformation>[] =
            serverResponse.results.map((result: ApiExploreStatisticResult) => {

            const encCounts: string[] = result.intervals.map((i: ApiInterval) => i.encCount);

            const decryptedCounts = this.cryptoService.decryptIntegersWithEphemeralKey(encCounts);

            return decryptedCounts.pipe(
                map(counts => {
                    const intervals = counts.map((count, intervalIndex) => {
                        const apiInterval = result.intervals[intervalIndex];
                        return new Interval(apiInterval.lowerBound, apiInterval.higherBound, count);
                    });

                    return new ChartInformation(intervals, result.unit, result.analyteName, cohortConstraint.textRepresentation);
                })
            );
        });



        forkJoin(chartsInformationsObservables).subscribe((chartsInformations: ChartInformation[]) => {
            // waiting for the intervals to be decrypted by the crypto service to emit the chart information to external listeners.
            this.chartsDataSubject.next(chartsInformations);
            this.displayLoadingIcon.next(false);
        });
    }

    private formatStatisticsQuery(results: number[][]) {
        const t = results.map((result) => result.map((innerResult) => innerResult));
        console.log('t', t);
        return "";
    }

    private sendRequest(apiRequest: ApiExploreStatistics): Observable<any> {
        const haveRightsForPatientList = !!this.keycloakService.getUserRoles().find((role) => role === "patient_list");

        return this.apiEndpointService.postCall(
            `projects/${this.config.projectId}/datasource/query`,
            {
              operation: "statisticsQuery",
              aggregationType: "aggregated",
              broadcast: true,
              outputDataObjectsNames: ["statisticsQueryResult"],
              parameters: apiRequest
            }
          )
          .pipe(
              map((e) => {
                  console.log('HERE', e);
                  console.log(this.formatStatisticsQuery(e.results.statisticsQueryResult));
                  return this.exploreQueryService.getDataobjectData(e.id);
                })
            )
    }

    private extractConceptsAndModifiers(analytes: TreeNode[]) {
        const conceptsPaths = analytes
            .filter(node => !node.isModifier)
            .map(node => node.path);




        const modifiers/*: Array<ModifierApiObjet>*/ = analytes.filter(node => node.isModifier()).map(node => {
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
        return this._lastCohortDefintion
    }

    get lastQueryTiming(): ApiI2b2Timing {
        return this._lastQueryTiming
    }

}
