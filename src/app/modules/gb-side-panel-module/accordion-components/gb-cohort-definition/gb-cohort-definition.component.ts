/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, ComponentFactoryResolver, ComponentRef, Input, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { CombinationConstraint } from 'src/app/models/constraint-models/combination-constraint';
import { Constraint } from 'src/app/models/constraint-models/constraint';
import { Utils } from 'src/app/modules/gb-explore-statistics-module/panel-components/gb-explore-statistics-results/gb-explore-statistics-results.component';
import { CohortService } from 'src/app/services/cohort.service';
import { ExploreStatisticsService } from 'src/app/services/explore-statistics.service';
import { ConstraintHelper } from 'src/app/utilities/constraint-utilities/constraint-helper';
import { HTMLExportVisitor } from './constraintVisitor/htmlExportVisitor';

type AnalytePath = String[]

@Component({
  selector: 'gb-cohort-definition',
  templateUrl: './gb-cohort-definition.component.html',
  styleUrls: ['./gb-cohort-definition.component.css']
})
export class GbCohortDefinitionComponent implements OnDestroy {

  @ViewChild('rootConstraintTemplate', { read: ViewContainerRef })
  rootConstraintTemplate: ViewContainerRef

  @ViewChild('exclusionTemplate', { read: ViewContainerRef })
  exclusionTemplate: ViewContainerRef
  @Input()
  noRootConstraint = true;
  @Input()
  analytesPaths: AnalytePath[] = []

  private rootConstraint: Constraint
  private inclusionComponentRef: ComponentRef<any>;



  constructor(private exploreStatisticsService: ExploreStatisticsService,
    private cohortService: CohortService,
    private componentFactoryResolver: ComponentFactoryResolver) {

    this.exploreStatisticsService.rootConstraint.subscribe(constraint => {
      this.rootConstraint = constraint
    })


    this.exploreStatisticsService.analytesSubject.subscribe(analytes => {
      const newElements: AnalytePath[] = []
      analytes.forEach(analyte => {
        newElements.push(Utils.extractDisplayablePath(analyte))
      })

      this.analytesPaths = newElements
    })
  }




  private constraintIsEmpty(c: Constraint): boolean {
    if (c === undefined || c === null) {
      return true
    }

    if (!(c instanceof CombinationConstraint)) {
      return false
    }

    // we are dealing with a combination constraint
    const comb = c as CombinationConstraint
    if (comb.children === undefined || comb.children.length === 0) {
      return true
    }

    return !ConstraintHelper.hasNonEmptyChildren(comb)
  }

  ngOnDestroy(): void {
    if (this.inclusionComponentRef !== undefined) {
      this.inclusionComponentRef.destroy()
    }

  }



  set cohortName(name: string) {
    this.cohortService.cohortName = name
  }
  get cohortName(): string {
    return this.cohortService.cohortName
  }

  get lastSuccessfulSet(): number[] {
    return this.cohortService.lastSuccessfulSet
  }

  save() {
    this.exploreStatisticsService.saveCohortStatistics()
  }

  // otherwise writes data in input filed
  preventDefault(event: Event) {
    event.preventDefault()
  }

  saveIfEnter(event) {
    if (event.keyCode === 13) {
      this.save()
    }
  }

  ngAfterViewInit() {
    if (this.constraintIsEmpty(this.rootConstraint)) {
      this.noRootConstraint = true
      return
    }

    this.noRootConstraint = false
    const visitor = new HTMLExportVisitor(0, this.componentFactoryResolver, this.rootConstraintTemplate)
    // const wrapped = this.wrapConstraint(this.inclusionConstraint)
    this.inclusionComponentRef = this.rootConstraint.accept(visitor)

  }
}
