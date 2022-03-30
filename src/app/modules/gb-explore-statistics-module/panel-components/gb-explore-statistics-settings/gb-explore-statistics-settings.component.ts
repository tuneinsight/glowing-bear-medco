/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { AutoComplete } from 'primeng/autocomplete';
import { GbConceptFormComponent } from 'src/app/modules/concept-form-component/gb-concept-form.component';
import { ConstraintService } from 'src/app/services/constraint.service';
import { TreeNodeService } from '../../../../services/tree-node.service';

@Component({
  selector: 'gb-explore-statistics-settings',
  templateUrl: './gb-explore-statistics-settings.component.html',
  styleUrls: ['./gb-explore-statistics-settings.component.css'],
})

/*
* This component handles the logic behind the form used to set the parameters
* of the creation of histogram about the counts of observations for a numerical concept.
*/
export class GbExploreStatisticsSettingsComponent extends GbConceptFormComponent {
  private _isDirty: Boolean = false


  @ViewChild('autoComplete', { static: false }) autoComplete: AutoComplete;
  @ViewChild('autoCompleteContainer', { static: false }) autoCompleteContainer: HTMLElement;

  @Output() changedEventConcepts: EventEmitter<boolean>

  constructor(
    element: ElementRef,
    constraintService: ConstraintService,
    treeNodeService: TreeNodeService) {
    super(constraintService, element, treeNodeService)

    this.changedEventConcepts = super.changedEventConcepts
  }


  set isDirty(isDirty: Boolean) {
    this._isDirty = isDirty
  }

  get isDirty(): Boolean {
    return this._isDirty
  }

}
