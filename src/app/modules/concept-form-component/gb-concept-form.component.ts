/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ElementRef, EventEmitter, Input, ViewChild } from '@angular/core';
import { AutoComplete } from 'primeng/autocomplete';
import { Concept } from '../../models/constraint-models/concept';
import { ConceptConstraint } from '../../models/constraint-models/concept-constraint';
import { ConstraintService } from '../../services/constraint.service';
import { TreeNodeService } from '../../services/tree-node.service';
import { UIHelper } from '../../utilities/ui-helper';

// TODO use this component using composition in survival curves.
// for reference see how to define abstract component:
// https://medium.com/@ozak/stop-repeating-yourself-in-angular-how-to-create-abstract-components-9726d43c99ab
export class GbConceptFormComponent {
  private _concept: Concept

  private _suggestedConcepts: ConceptConstraint[]
  private _activated: boolean

  protected changedEventConcepts: EventEmitter<boolean>

  private _eventHovering: boolean;


  @ViewChild('autoComplete', { static: false }) autoComplete: AutoComplete;
  @ViewChild('autoCompleteContainer', { static: false }) autoCompleteContainer: HTMLElement;




  constructor(protected constraintService: ConstraintService,
    private element: ElementRef,
    protected treeNodeService: TreeNodeService) {
    this._eventHovering = false
  }




  protected onDrop(event: DragEvent): Concept {
    event.preventDefault()
    event.stopPropagation()
    this._eventHovering = false

    return this.treeNodeService.processSelectedConstraint()

  }



  search(event) {
    let results = this.constraintService.searchAllConstraints(event.query);
    this.suggestedConcepts = results
      .filter(constraint => constraint instanceof ConceptConstraint)
      .map(constraint => (constraint as ConceptConstraint));
    if (this.element) {
      UIHelper.removePrimeNgLoaderIcon(this.element, 200)
    }
  }


  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.eventHovering = true
  }

  onDragLeave(event: DragEvent) {
    this.eventHovering = false
  }



  onConceptDrop(event: DragEvent) {
    let concept = this.onDrop(event)
    if (concept) {
      this._concept = concept
    }
  }

  onDropdown(event) {
    if (this.element) {
      UIHelper.removePrimeNgLoaderIcon(this.element, 200);
    }
  }


  @Input()
  set activated(bool: boolean) {
    this._activated = bool
  }

  get activated(): boolean {
    return this._activated
  }

  get eventHovering(): boolean {
    return this._eventHovering
  }


  set suggestedConcepts(concepts: ConceptConstraint[]) {
    this._suggestedConcepts = concepts
  }

  get suggestedConcepts(): ConceptConstraint[] {
    return this._suggestedConcepts
  }


  protected get concept(): Concept {
    return this._concept
  }

  protected set concept(concept: Concept) {
    this._concept = concept
  }

  set eventHovering(eventHovering: boolean) {
    this._eventHovering = eventHovering
  }
}
