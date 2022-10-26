/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {v4 as uuidv4} from 'uuid';
import {Injectable} from '@angular/core';
import {AuthenticationService} from './authentication.service';
import {CryptoService} from './crypto.service';
import {MedcoNetworkService} from './api/medco-network.service';
import {ExploreSearchService} from './api/medco-node/explore-search.service';
import {ApiSurvivalAnalysisService} from './api/medco-node/api-survival-analysis.service';
import {CohortService} from './cohort.service';
import {Concept} from '../models/constraint-models/concept';
import {Granularity} from '../models/survival-analysis/granularity-type';
import {ErrorHelper} from '../utilities/error-helper';
import {ConstraintMappingService} from './constraint-mapping.service';
import {When} from '../models/survival-analysis/when-type';
import {SurvivalSettings} from '../models/survival-analysis/survival-settings';
import {ApiSurvivalAnalysis} from '../models/api-request-models/survival-analyis/api-survival-analysis';
import {CombinationConstraint} from '../models/constraint-models/combination-constraint';
import {ApiI2b2Timing} from '../models/api-request-models/medco-node/api-i2b2-timing';
import {QueryTemporalSetting} from '../models/query-models/query-temporal-setting';
import {SequentialConstraint} from '../models/constraint-models/sequential-constraint';
import {QueryService} from './query.service';

export class SubGroup {
  name: string
  timing: ApiI2b2Timing

  queryTemporalSetting: QueryTemporalSetting
  rootSelectionConstraint: CombinationConstraint
  rootSequentialConstraint: SequentialConstraint
}

@Injectable()
export class SurvivalService {
  private _id: string
  private _patientGroupIds: Map<string, number[]> // one string[] per node
  private _granularity = Granularity.month
  private _limit = 48
  private _startConcept: Concept
  private _endConcept: Concept
  private _startModifier = '@'
  private _endModifier = '@'
  private _startsWhen = When.earliest
  private _endsWhen = When.earliest
  private _subGroups = new Array<SubGroup>()

  set granularity(gran: Granularity) {
    this._granularity = gran
  }

  get granularity(): Granularity {
    return this._granularity
  }

  set limit(lim: number) {
    this._limit = lim
  }

  get limit(): number {
    return this._limit
  }

  set startConcept(c: Concept) {
    this._startConcept = c
  }
  get startConcept(): Concept {
    return this._startConcept
  }
  set endConcept(c: Concept) {
    this._endConcept = c
  }
  get endConcept(): Concept {
    return this._endConcept
  }

  set startModifier(mod: string) {
    this._startModifier = mod
  }

  get startModifier(): string {
    return this._startModifier
  }

  set endModifier(mod: string) {
    this._endModifier = mod
  }

  get endModifier(): string {
    return this._endModifier
  }

  set startsWhen(when: When) {
    this._startsWhen = when

  }
  get startsWhen(): When {
    return this._startsWhen
  }

  set endsWhen(when: When) {
    this._endsWhen = when

  }
  get endsWhen(): When {
    return this._endsWhen
  }

  set subGroups(sg: SubGroup[]) {
    this._subGroups = sg
  }

  get subGroups(): SubGroup[] {
    return this._subGroups
  }


  constructor(private authService: AuthenticationService,
    private cryptoService: CryptoService,
    private medcoNetworkService: MedcoNetworkService,
    private exploreSearchService: ExploreSearchService,
    private apiSurvivalAnalysisService: ApiSurvivalAnalysisService,
    private queryService: QueryService,
    private cohortService: CohortService,
    private constraintMappingService: ConstraintMappingService) {
    this._patientGroupIds = new Map<string, number[]>()
    medcoNetworkService.nodes.forEach((apiNodeMetadata => { this._patientGroupIds[apiNodeMetadata.name] = new Array<string>() }
    ).bind(this))


  }

  runSurvivalAnalysis() {
    let apiSurvivalAnalysis = new ApiSurvivalAnalysis()
    let d = new Date()
    apiSurvivalAnalysis.id = uuidv4();
    if (!this.startConcept) {
      throw ErrorHelper.handleNewError('Start event is undefined')
    }
    apiSurvivalAnalysis.startConcept = this.startConcept.path
    if (this.startConcept.modifier) {
      apiSurvivalAnalysis.startConcept = this.startConcept.modifier.appliedConceptPath
      apiSurvivalAnalysis.startModifier = {
        modifierKey: this.startConcept.modifier.path,
        appliedPath: this.startConcept.modifier.appliedPath
      }
    }

    if (!this.endConcept) {
      throw ErrorHelper.handleNewError('End event is undefined')
    }
    apiSurvivalAnalysis.endConcept = this.endConcept.path
    if (this.endConcept.modifier) {
      apiSurvivalAnalysis.endConcept = this.endConcept.modifier.appliedConceptPath
      apiSurvivalAnalysis.endModifier = {
        modifierKey: this.endConcept.modifier.path,
        appliedPath: this.endConcept.modifier.appliedPath
      }
    }

    apiSurvivalAnalysis.timeLimit = this.limit
    if (!this.granularity) {
      throw ErrorHelper.handleNewError('Granularity is undefined')
    }
    apiSurvivalAnalysis.timeGranularity = this.granularity

    apiSurvivalAnalysis.startsWhen = this.startsWhen
    apiSurvivalAnalysis.endsWhen = this.endsWhen

    apiSurvivalAnalysis.cohortQueryID = this.cohortService.selectedCohort.exploreQueryId;
    apiSurvivalAnalysis.subGroupsDefinitions = this.subGroups.map(
      sg => {
        return {
          name: sg.name,
          constraint: {
            queryTiming: sg.timing,
            selectionPanels: this.constraintMappingService.mapConstraint(sg.rootSelectionConstraint,
              this.queryService.queryTiming === QueryTemporalSetting.independent),
            sequentialPanels: this.constraintMappingService.mapConstraint(sg.rootSequentialConstraint,
              this.queryService.queryTiming === QueryTemporalSetting.independent),
            sequentialOperators: sg.rootSequentialConstraint.temporalSequence,
          }
        }
      }
    )


    return this.apiSurvivalAnalysisService.survivalAnalysisAllNodes(apiSurvivalAnalysis)
  }

  settings(): SurvivalSettings {

    let subGroupsTextualRepresentations = this._subGroups.map(sg => {
      return {
        groupId: sg.name,
        rootSelectionConstraint: sg.rootSelectionConstraint ? sg.rootSelectionConstraint.textRepresentation : null,
        rootSequentialConstraint: sg.rootSequentialConstraint ? sg.rootSequentialConstraint.textRepresentation : null
      }
    })
    return new SurvivalSettings(
      this._granularity,
      this._limit,
      this._startConcept.name,
      this._startsWhen,
      this._endConcept.name,
      this._endsWhen,
      subGroupsTextualRepresentations,
    )
  }
}
