/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Component, ElementRef, Input } from '@angular/core';
import { Concept } from 'src/app/models/constraint-models/concept';
import { ConceptConstraint } from 'src/app/models/constraint-models/concept-constraint';
import { ValueType } from 'src/app/models/constraint-models/value-type';
import { TreeNode } from 'src/app/models/tree-models/tree-node';
import { GbConceptFormComponent } from 'src/app/modules/concept-form-component/gb-concept-form.component';
import { ConstraintService } from 'src/app/services/constraint.service';
import { ExploreStatisticsService } from 'src/app/services/explore-statistics.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';
import { ErrorHelper } from 'src/app/utilities/error-helper';
import { Utils } from '../../gb-explore-statistics-module/panel-components/gb-explore-statistics-results/gb-explore-statistics-results.component';


@Component({
    templateUrl: './gb-analytes-dropzones.component.html',
    styleUrls: ['./gb-analytes-dropzones.component.css'],
    selector: 'gb-analytes-dropzones'
})

export class GbAnalytesDropzones extends GbConceptFormComponent {
    @Input()
    childrenWrappers: TreeNodeWrapper[] = []

    constructor(constraintService: ConstraintService,
        element: ElementRef,
        protected treeNodeService: TreeNodeService,
        protected statsService: ExploreStatisticsService) {
        super(constraintService, element, treeNodeService)

        this.childrenWrappers = this.statsService.analytes.map(a => this.createTreeNodeChild(a))
    }

    protected onDrop(event: DragEvent) {
        event.preventDefault()
        event.stopPropagation()
        this.eventHovering = false

        let node = this.treeNodeService.selectedTreeNode
        if (!node) {
            return null
        }

        if (!GbAnalytesDropzones.validValueType(node.valueType)) {
            ErrorHelper.handleNewError("The node you dropped in this form is not of numerical type.")
            return null
        }


        this.pushNewChild(node)

        this.clear()

    }

    private pushNewChild(node: TreeNode) {
        const child = this.createTreeNodeChild(node);

        this.childrenWrappers.push(child)
        this.notifyUpdate()
    }

    private createTreeNodeChild(node: TreeNode): TreeNodeWrapper {
        const child = new TreeNodeWrapper(node);

        // creating a callback for the child which will remove the child out of the children list of the parent component
        this.setOnRemove(child);
        return child;
    }

    private setOnRemove(child: TreeNodeWrapper) {
        const disown = () => {
            const index = this.childrenWrappers.indexOf(child);
            if (index === -1) {
                return;
            }
            //removing the child from the list of children of the component.
            this.childrenWrappers.splice(index, 1);
            this.notifyUpdate();
        };
        child.setOnRemove(disown);
    }

    notifyUpdate() {
        const children = this.childrenWrappers.map(w => w.treeNode)
        if (children === null || children === undefined) {
            console.warn("undefined children in analytes dropzone component")
            return
        }
        this.statsService.analytes = children
    }

    //cleaning the input field
    clear() {
        if (!this.concept) {
            return
        }
        this.concept.path = null
        this.concept = null
    }

    onSelect(selected: ConceptConstraint) {
        if (!selected || !selected.treeNode) {
            throw ErrorHelper.handleNewError("Impossible to set this concept as selected")
        }

        this.pushNewChild(selected.treeNode)

        this.clear()
    }

    set concept(concept: Concept) {
        super.concept = concept
        console.log("new concept value ", this.concept)
    }


    set wrapperTreeNode(event) {
        console.log(event)
    }

    public static validValueType(valueType: ValueType): boolean {
        return valueType === ValueType.NUMERICAL
    }

    set suggestedConcepts(concepts: ConceptConstraint[]) {
        super.suggestedConcepts = concepts
    }

    get suggestedConcepts(): ConceptConstraint[] {
        const suggested = super.suggestedConcepts
        if (!suggested) {
            return []
        }
        return suggested.filter(c => GbAnalytesDropzones.validValueType(c.concept.type))
    }
}



//TODO comment logic
class TreeNodeWrapper {

    private _treeNode: TreeNode
    pathElements: string[] = []


    onRemove: () => void = () => { }

    constructor(treeNode: TreeNode) {
        this._treeNode = treeNode
        this.pathElements = Utils.extractDisplayablePath(treeNode)
    }

    get treeNode(): TreeNode {
        return this._treeNode
    }

    setOnRemove(onRemove: () => void) {
        this.onRemove = onRemove
    }

    path(): string {
        return this._treeNode.path
    }

}