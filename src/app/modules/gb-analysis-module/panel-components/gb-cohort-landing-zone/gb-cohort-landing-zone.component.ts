/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { SelectItem } from 'primeng';
import { SubGroup, SurvivalService } from '../../../../services/survival-analysis.service';
import { AnalysisService } from '../../../../services/analysis.service';
import { ConstraintService } from '../../../../services/constraint.service';
import { OperationType } from '../../../../models/operation-models/operation-types';
import { CohortService } from '../../../../services/cohort.service';
import { ApiI2b2Timing } from '../../../../models/api-request-models/medco-node/api-i2b2-timing';
import { QueryService } from '../../../../services/query.service';
import { ErrorHelper } from '../../../../utilities/error-helper';
import { QueryTemporalSetting } from 'src/app/models/query-models/query-temporal-setting';

const nameMaxLength = 20

@Component({
  selector: 'gb-cohort-landing-zone',
  templateUrl: './gb-cohort-landing-zone.component.html',
  styleUrls: ['./gb-cohort-landing-zone.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GbCohortLandingZoneComponent implements OnInit {

  _activated: boolean
  _subGroups: SelectItem[]
  _name = ''
  _selectedSubGroup: SubGroup
  _usedNames: Set<string>

  OperationType = OperationType

  constructor(private analysisService: AnalysisService,
    private cohortService: CohortService,
    private constraintService: ConstraintService,
    private queryService: QueryService,
    private survivalService: SurvivalService) {
    this._subGroups = new Array()
    this._usedNames = new Set()

  }


  ngOnInit() {

    // reload existing subgroups from previous analysis
    this._subGroups = this.survivalService.subGroups.map(sg => { return { label: sg.name, value: sg } })
  }

  @Input()
  set activated(a: boolean) {
    this._activated = a
  }

  get activated(): boolean {
    return this._activated
  }

  get expanded(): boolean {
    return this.analysisService.survivalSubGroupExpanded
  }

  set expanded(val: boolean) {
    this.analysisService.survivalSubGroupExpanded = val
  }


  get subGroups(): SelectItem[] {
    return this._subGroups
  }

  set selectedSubGroup(rootConstraints: SubGroup) {
    this._selectedSubGroup = rootConstraints
  }

  get selectedSubGroup(): SubGroup {
    return this._selectedSubGroup
  }

  set name(n: string) {
    this._name = n
  }

  get name(): string {
    return this._name
  }

  addSubGroup(event: Event) {

    if (this.name === '') {
      throw ErrorHelper.handleNewUserInputError('Subgroup name cannot be empty.');
    } else if (this._usedNames.has(this.name)) {
      throw ErrorHelper.handleNewUserInputError(`Subgroup name ${this.name} already used.`);
    } else if (!this.cohortService.patternValidation.test(this.name).valueOf()) {
      throw ErrorHelper.handleNewUserInputError(`Subgroup name ${this.name} can only contain alphanumerical symbols (without ö é ç ...) and underscores "_".`);
    } else if (this.name.length > nameMaxLength) {
      throw ErrorHelper.handleNewUserInputError(`Subgroup name length cannot exceed ${nameMaxLength}.`);
    } else if (!this.constraintService.hasSelectionConstraint()) {
      throw ErrorHelper.handleNewUserInputError('Selection constraint is empty, nothing to add.');
    }

    let inputValueValidation = this.constraintService.validateConstraintValues()
    if (inputValueValidation !== '') {
      throw ErrorHelper.handleNewUserInputError(`in definition of subgroup ${this.name} : ` + inputValueValidation)
    }

    let newSubGroup: SubGroup = {
      name: this.name,
      queryTemporalSetting: this.queryService.queryTiming,
      timing: this.queryService.queryTiming ? ApiI2b2Timing.sameInstanceNum : ApiI2b2Timing.any,
      rootSelectionConstraint: this.constraintService.rootSelectionConstraint.clone(),
      rootSequentialConstraint: this.constraintService.rootSequentialConstraint.clone(),
    }
    this.subGroups.push({ label: this.name, value: newSubGroup })
    this._usedNames.add(this.name)
    this.reset()

    this.survivalService.subGroups = this.subGroups.map(({ value }) => value as SubGroup)
    this.selectedSubGroup = null
  }

  removeSubGroup(event: Event) {
    let nameToRemove = this.selectedSubGroup.name
    this._usedNames.delete(this._selectedSubGroup.name)
    this.selectedSubGroup = null
    this._subGroups = this.subGroups.filter(({ label }) => label !== nameToRemove)
    this.survivalService.subGroups = this.subGroups.map(({ value }) => value as SubGroup)
  }

  loadSubGroup(event: Event) {
    this.name = this.selectedSubGroup.name
    this.queryService.queryTiming = this.selectedSubGroup.queryTemporalSetting
    this.constraintService.rootSelectionConstraint = this.selectedSubGroup.rootSelectionConstraint.clone()
    this.constraintService.rootSequentialConstraint = this.selectedSubGroup.rootSequentialConstraint.clone()
  }

  clearName() {
    this._name = ''
  }

  // otherwise it writes data in input field
  preventDefault(event: Event) {
    event.preventDefault()
  }

  removeAll() {
    this._subGroups = new Array()
    this.survivalService.subGroups = new Array()
    this._usedNames = new Set()
    this.reset()
    this.queryService.clearAll()
    this.selectedSubGroup = null
  }

  reset() {
    this.clearName()
    this.queryService.queryTiming = QueryTemporalSetting.independent
    this.constraintService.clearConstraint()
  }

}
