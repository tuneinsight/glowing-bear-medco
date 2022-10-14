/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ExploreQueryService } from './api/medco-node/explore-query.service';
import { MedcoNetworkService } from './api/medco-network.service';
import { ConstraintService } from './constraint.service';
import { ExploreCohortsService } from './api/medco-node/explore-cohorts.service';
import { ConstraintReverseMappingService } from './constraint-reverse-mapping.service';
import { MessageHelper } from '../utilities/message-helper';
import { ConceptConstraint } from '../models/constraint-models/concept-constraint';
import { Cohort } from '../models/cohort-models/cohort';
import { Constraint } from '../models/constraint-models/constraint';
import { ApiI2b2Timing } from '../models/api-request-models/medco-node/api-i2b2-timing';
import { ApiCohortResponse } from '../models/api-response-models/medco-node/api-cohort-response';
import { CombinationState } from '../models/constraint-models/combination-state';
import { CombinationConstraint } from '../models/constraint-models/combination-constraint';
import { ApiCohort } from '../models/api-request-models/medco-node/api-cohort';
import { HttpErrorResponse } from '@angular/common/http';
import { QueryService } from './query.service';
import { ApiI2b2Panel } from '../models/api-request-models/medco-node/api-i2b2-panel';
import { ApiQueryDefinition } from '../models/api-request-models/medco-node/api-query-definition';
import { ApiNodeMetadata } from '../models/api-response-models/medco-network/api-node-metadata';
import { ErrorHelper } from '../utilities/error-helper';
import { ApiI2b2SequentialOperator } from '../models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { map, tap } from 'rxjs/operators';
import { ApiI2b2TimingSequenceSpan } from '../models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-span/api-i2b2-timing-sequence-span';
import { SequentialConstraint } from '../models/constraint-models/sequential-constraint';

@Injectable()
export class CohortService {

  private _cohorts: Array<Cohort>
  private _selectedCohort: Cohort
  private _nodeName: Array<string>

  private _isRefreshing: boolean

  // internal states of the explore component handling cohorts
  _cohortName: string
  _lastSuccessfulSet: number[]

  // term restoration
  public restoring: Subject<boolean>
  private _queryTiming: Subject<ApiI2b2Timing>
  private _queryTemporalSequence: Subject<ApiI2b2SequentialOperator[]>
  private _panelTimings: Subject<ApiI2b2Timing[]>

  private _lastPatientList: [ApiNodeMetadata[], number[][]]

  // constraint on cohort name
  _patternValidation: RegExp


  private static apiCohortsToCohort(apiCohorts: ApiCohortResponse): Cohort[] {

    const cohortNumber = apiCohorts.results.cohorts.length;

    let cohortName: string;

    let res = new Array<Cohort>()
    for (let i = 0; i < cohortNumber; i++) {
      let cohort = new Cohort(
        cohortName = apiCohorts.results.cohorts[i].name,
        null,
        null,
        new Date(apiCohorts.results.cohorts[i].CreationDate),
        new Date(apiCohorts.results.cohorts[i].CreationDate)
      );

      cohort.queryDefinition = apiCohorts.results.cohorts[i].exploreQuery.definition;
      cohort.exploreQueryId = apiCohorts.results.cohorts[i].exploreQuery.id;
      res.push(cohort);

    }
    return res

  }

  /**
   * unflattenConstraints check if the root constraints are made of a simple concept constraint,
   * or AND-composed consrtaints. If it is the case, it unflattens them into AND-composed OR-composed combinations
   *
   * @param flatConstraint
   * @returns {Constraint}
   *
   */
  private static unflattenConstraints(flatConstraint: Constraint): Constraint {
    if (!(flatConstraint)) {
      return null
    }
    if (!(flatConstraint instanceof CombinationConstraint)) {
      let newCombination = new CombinationConstraint()
      newCombination.combinationState = CombinationState.And
      newCombination.panelTimingSameInstance = flatConstraint.panelTimingSameInstance
      let newLevel2Combination = new CombinationConstraint()
      newLevel2Combination.combinationState = CombinationState.Or
      newLevel2Combination.addChild(flatConstraint)
      newLevel2Combination.excluded = flatConstraint.excluded
      newCombination.addChild(newLevel2Combination)
      return newCombination

    }
    let newAndCombination = flatConstraint.clone()
    for (let i = 0; i < (flatConstraint as CombinationConstraint).children.length; i++) {
      const childConstraint = (flatConstraint as CombinationConstraint).children[i]
      if (childConstraint instanceof ConceptConstraint) {
        let newConstraint = new CombinationConstraint()
        newConstraint.combinationState = CombinationState.Or
        newConstraint.excluded = childConstraint.excluded
        newConstraint.panelTimingSameInstance = childConstraint.panelTimingSameInstance;
        newConstraint.addChild((newAndCombination as CombinationConstraint).children[i]);
        (newAndCombination as CombinationConstraint).children[i] = newConstraint;
      }
    }

    return newAndCombination

  }

  constructor(
    private exploreCohortsService: ExploreCohortsService,
    private queryService: QueryService,
    private exploreQueryService: ExploreQueryService,
    private medcoNetworkService: MedcoNetworkService,
    private constraintService: ConstraintService,
    private constraintReverseMappingService: ConstraintReverseMappingService) {
    this.restoring = new Subject<boolean>()
    this._queryTiming = new Subject<ApiI2b2Timing>()
    this._queryTemporalSequence = new Subject<ApiI2b2SequentialOperator[]>()
    this._panelTimings = new Subject<ApiI2b2Timing[]>()
    this._nodeName = new Array<string>(this.medcoNetworkService.nodes.length)
    this.medcoNetworkService.nodes.forEach((apiMetadata => {
      this._nodeName[apiMetadata.index] = apiMetadata.name
    }).bind(this))
    this._patternValidation = new RegExp('^\\w+$')
    this._cohorts = new Array<Cohort>()

    this.queryService.queryResults.subscribe(
      result => {
        if ((result) && (result.patientLists)) {
          this._lastPatientList = [result.nodes, result.patientLists];
        }
      }
    )
  }

  get cohorts() {
    return this._cohorts
  }
  get selectedCohort() {
    return this._selectedCohort
  }
  set selectedCohort(cohort: Cohort) {
    if (this._selectedCohort) {
      this._selectedCohort.selected = false

      if (this._selectedCohort === cohort) {
        this._selectedCohort = undefined
        return
      }

    }
    this._selectedCohort = cohort
    if (cohort) {
      this._selectedCohort.selected = true
    }
  }

  set cohorts(cohorts: Array<Cohort>) {
    this._cohorts = cohorts.map(x => x)
  }
  get isRefreshing(): boolean {
    return this._isRefreshing
  }

  set lastSuccessfulSet(setIDs: number[]) {
    this._lastSuccessfulSet = setIDs
  }

  get lastSuccessfulSet(): number[] {
    return this._lastSuccessfulSet
  }

  set cohortName(name: string) {
    this._cohortName = name
  }

  get cohortName(): string {
    return this._cohortName
  }

  get queryTiming(): Observable<ApiI2b2Timing> {
    return this._queryTiming.asObservable()
  }

  get queryTemporalSequence(): Observable<ApiI2b2SequentialOperator[]> {
    return this._queryTemporalSequence.asObservable()
  }

  get patternValidation(): RegExp {
    return this._patternValidation
  }

  getCohorts() {
    this._isRefreshing = true;
    this.exploreCohortsService.getCohortAllNodes().pipe(
      // else the clone() is undefined
      map(apiCohortResponse => {
      if (apiCohortResponse.results.cohorts !== null) {
        for ( let i = 0; i < apiCohortResponse.results.cohorts.length; i++) {
          let seq = apiCohortResponse.results.cohorts[i].exploreQuery.definition.sequentialOperators
          if (seq !== null) {
            let seqWithObject = seq.map((seqElm) => {
              // the received seqElm is not a complete object, because it does not have methods
              let ret = new ApiI2b2SequentialOperator()
              ret.when = seqElm.when
              ret.whichDateFirst = seqElm.whichDateFirst
              ret.whichDateSecond = seqElm.whichDateSecond
              ret.whichObservationFirst = seqElm.whichObservationFirst
              ret.whichObservationSecond = seqElm.whichObservationSecond
              ret.spans = ((seqElm.spans) && (seqElm.spans.length > 0)) ?
                seqElm.spans.map(span => {
                  let retSpan = new ApiI2b2TimingSequenceSpan()
                  retSpan.operator = span.operator
                  retSpan.units = span.units
                  retSpan.value = span.value
                  return retSpan
                }) : null
              return ret
            })
            apiCohortResponse.results.cohorts[i].exploreQuery.definition.sequentialOperators = seqWithObject
          }
        }
      }
      return apiCohortResponse
    })).subscribe({
      next: (apiCohorts => {
        try {
          this.updateCohorts(CohortService.apiCohortsToCohort(apiCohorts))
        } catch (err) {
          MessageHelper.alert('error', 'An error occurred with received saved cohorts', (err as Error).message)
        }
        this._isRefreshing = false
      }).bind(this),
      error: (err => {
        MessageHelper.alert('error', 'An error occurred while retrieving saved cohorts', (err as HttpErrorResponse).error.message)
        this._isRefreshing = false

      }).bind(this),
      complete: (() => {
        // MessageHelper.alert('success', 'Saved cohorts successfully retrieved')
        this._isRefreshing = false
      }).bind(this)
    })
  }

  postCohort(cohort: Cohort) {
    this._isRefreshing = true
    let cohortName = cohort.name

    this.exploreCohortsService.postCohortAllNodes(cohortName, this.exploreQueryService.lastQueryId).subscribe(message => {
      cohort.exploreQueryId = this.exploreQueryService.lastQueryId;
      this.updateCohorts([cohort]);
      this._isRefreshing = false
    },
      error => {
        MessageHelper.alert('error', 'An error occurred while saving cohort', (error as HttpErrorResponse).error.message)
        this._isRefreshing = false
      })

  }

  updateCohorts(cohorts: Cohort[]) {
    let tmp = new Map<string, Date>()
    this._cohorts.forEach(cohort => {
      tmp.set(cohort.name, cohort.updateDate)
    })
    cohorts.forEach(newCohort => {
      if (tmp.has(newCohort.name)) {
        const localDate = tmp.get(newCohort.name)
        const remoteDate = newCohort.updateDate
        if (remoteDate >= localDate) {
          let i = this._cohorts.findIndex(c => c.name === newCohort.name)
          this._cohorts[i] = newCohort
        } else {
          MessageHelper.alert('warn', `New version of cohort ${newCohort.name} was skipped for update because its update date is less recent than the one of existing cohort: ` +
            `local version date: ${localDate.toISOString()}, remote version ${remoteDate.toISOString()}`)
        }
      } else {
        this._cohorts.push(newCohort)
        tmp.set(newCohort.name, newCohort.updateDate)
      }
    })

  }

  removeCohorts(cohort: Cohort) {
    this.exploreCohortsService.removeCohortAllNodes(cohort.name, cohort.exploreQueryId).subscribe(
      message => {
        console.log('on remove cohort, message: ', message)
      },
      err => {
        MessageHelper.alert('error', 'An error occurred while removing saved cohorts', (err as HttpErrorResponse).error.message)
      }
    )
  }




  // from view to cached

  addCohort(name: string) {

  }

  // from cached to view
  restoreTerms(cohort: Cohort): void {

    let cohortDefinition = cohort.queryDefinition
    if (!cohortDefinition) {
      MessageHelper.alert('warn', `Definition not found for cohort ${cohort.name}`)
      return
    }

    this._queryTiming.next(cohortDefinition.queryTiming)
    if ((cohortDefinition.selectionPanels !== undefined) &&
      (cohortDefinition.selectionPanels !== null) &&
      (cohortDefinition.selectionPanels.length !== 0)) {
      this.constraintReverseMappingService.mapPanels(cohortDefinition.selectionPanels)
        .subscribe(constraint => {
          constraint = CohortService.unflattenConstraints(constraint)
          if (constraint) {
            if (constraint instanceof ConceptConstraint) {
              this.constraintService.rootSelectionConstraint.addChild(constraint)
            } else {
              this.constraintService.rootSelectionConstraint = (constraint as CombinationConstraint);
              this.constraintService.rootSelectionConstraint.isRoot = true
            }
          }
        })
    } else {
      this.constraintService.rootSelectionConstraint = new CombinationConstraint()
    }
    if ((cohortDefinition.sequentialPanels !== undefined) &&
      (cohortDefinition.sequentialPanels !== null) &&
      (cohortDefinition.sequentialPanels.length !== 0)) {
      this.constraintReverseMappingService.mapPanels(cohortDefinition.sequentialPanels)
        .subscribe(constraint => {
          if (constraint instanceof ConceptConstraint) {
            this.constraintService.rootSequentialConstraint.addChild(constraint)
          } else {

            this.constraintService.rootSequentialConstraint = new SequentialConstraint();
            (constraint as CombinationConstraint).children.forEach(child => {
              this.constraintService.rootSequentialConstraint.addChild(child)
            });
            this.constraintService.rootSequentialConstraint.isRoot = true
          }
        })
      this._queryTemporalSequence.next(cohortDefinition.sequentialOperators)
      if (cohortDefinition.sequentialOperators.length !== (cohortDefinition.sequentialPanels.length - 1)) {
        MessageHelper.alert('error', `A query with sequence of events have ${cohortDefinition.sequentialOperators.length} operators ` +
          `for ${cohortDefinition.sequentialOperators.length} sequential events, there should be ${cohortDefinition.sequentialOperators.length - 1}`)
      }
    } else {
      this.constraintService.rootSequentialConstraint = new SequentialConstraint()
      this._queryTemporalSequence.next(null)
    }
    this.restoring.next(true)
  }

  saveCohortExplore() {
    this.saveCohort(this.queryService.lastTiming)
  }


  saveCohort(queryTiming: ApiI2b2Timing) {
    if (this.cohortName === '') {
      throw ErrorHelper.handleNewUserInputError('You must provide a name for the cohort you want to save.');
    } else if (!this.patternValidation.test(this.cohortName).valueOf()) {
      throw ErrorHelper.handleNewUserInputError(`Name ${this.cohortName} can only contain alphanumerical symbols (without ö é ç ...) and underscores "_".`);
    }

    let existingCohorts = this.cohorts
    if (existingCohorts.findIndex((c => c.name === this.cohortName).bind(this)) !== -1) {
      throw ErrorHelper.handleNewUserInputError(`Name ${this.cohortName} already used.`);
    }

    const nunc = Date.now()
    let definition = new ApiQueryDefinition()
    definition.selectionPanels = this.queryService.lastSelectionDefinition
    definition.sequentialPanels = this.queryService.lastSequenceDefinition
    definition.queryTiming = queryTiming
    definition.queryTiming = this.queryService.lastTiming
    definition.sequentialOperators = this.queryService.lastTimingSequence

    let cohort = new Cohort(
      this.cohortName,
      this.constraintService.rootSelectionConstraint,
      this.constraintService.rootSequentialConstraint,
      new Date(nunc),
      new Date(nunc),
    )
    cohort.queryDefinition = definition

    this.postCohort(cohort);
    MessageHelper.alert('success', 'Cohort successfully saved.');

    this.cohortName = ''
  }

  clearAll() {
    this.cohorts = [];
  }
}
