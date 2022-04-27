import {
    AfterViewInit, Component, ComponentFactoryResolver,
    ComponentRef, Input, OnDestroy, Type, ViewChild, ViewContainerRef
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CohortConstraint } from 'src/app/models/constraint-models/cohort-constraint';
import { CombinationConstraint } from 'src/app/models/constraint-models/combination-constraint';
import { CombinationState } from 'src/app/models/constraint-models/combination-state';
import { ConceptConstraint } from 'src/app/models/constraint-models/concept-constraint';
import { Constraint } from 'src/app/models/constraint-models/constraint';
import { ConstraintVisitor } from 'src/app/models/constraint-models/constraintVisitor';
import { GenomicAnnotationConstraint } from 'src/app/models/constraint-models/genomic-annotation-constraint';
import { TimeConstraint } from 'src/app/models/constraint-models/time-constraint';
import { ValueConstraint } from 'src/app/models/constraint-models/value-constraint';
import { Utils } from 'src/app/modules/gb-explore-statistics-module/panel-components/gb-explore-statistics-results/gb-explore-statistics-results.component';
import { PathDisplayerComponent, includedExcludedCSS } from 'src/app/modules/gb-utils-module/gb-utils.component';




@Component({
    styles: [
        `span {
            background-color: transparent;
            border-color: white;
            text-align: center;
            white-space: nowrap;
            vertical-align: middle;
            border: 1px solid;
            font-size: 1rem;
            border-radius: 0.25rem;
            padding: 0.1em .5em;
            font-style:italic;
        }`,
        `div {
            margin-bottom: 1em;
        }`
    ],
    template: `
    <div>
        <span>
            {{operator}}
        </span>
    </div>
    `

})
export class OperatorComponent {
    operator: string

    set state(state: CombinationState) {
        switch (state) {
            case CombinationState.And:
                this.operator = 'and'
                break;
            case CombinationState.Or:
                this.operator = 'or'
                break;
            default:
                this.operator = 'unknown operator'
                console.error('We should not be there missing case!')
                break
        }
    }

}



// todo create a variable out of the border color
@Component({
    styles: [
        `
        .combinationConstraint {
            border-radius: 1em;
            padding: .5em;
            transition: .3s;
            border-left: transparent solid;
            margin-top: .5em;
            margin-bottom: .5em;
        }
        .combinationConstraint .combinationConstraint {
            margin-left: 2em;
        }
        .combinationConstraint:hover {
            border-left: rgba(255, 160, 71, 0.6) solid;
        }
        `,
        includedExcludedCSS
    ],
    // TODO add a tooltip
    template: `
    <div class="combinationConstraint" [ngClass]="getCSSClass()">
        <ng-template #childrenContainer>
        </ng-template>
    </div>
    `
})
export class CombinationConstraintSummaryComponent implements OnDestroy, AfterViewInit {


    @Input()
    children: ComponentRef<any>[] = []

    @Input()
    excluded: boolean

    /* If the constraint is at root level height is 0.
    * If the constraint has one parent its height is 1. If the constraint has parents and grandparents its height is 2...
    */
    @Input()
    height = 0

    _state: CombinationState

    @ViewChild('childrenContainer', { read: ViewContainerRef }) // TODO test if can set this field as private
    childrenContainer: ViewContainerRef;

    private containerRefSubject: Subject<ViewContainerRef> = new Subject()

    constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

    set state(state: CombinationState) {
        this._state = state
    }

    getCSSClass() {
        if (this.height === 0) {
            return {}
        }

        return { 'excluded': this.excluded, }
    }

    addOperator() {
        const operatorComponent = Utils.buildComponent(this.componentFactoryResolver, this.childrenContainer, OperatorComponent)
        operatorComponent.instance.state = this._state
        this.children.push(operatorComponent)
    }

    ngAfterViewInit() {
        this.containerRefSubject.next(this.childrenContainer)
    }

    get containerRef(): Observable<ViewContainerRef> {
        return this.containerRefSubject
    }

    ngOnDestroy(): void {
        if (!this.children) {
            return
        }

        this.children.forEach(c => c.destroy())
    }

}

@Component({
    styles: [
        `'.simpleConceptSummary {
            padding: .3em;
            margin: 1em;
        } `,
        includedExcludedCSS
    ],

    template: `
    <div class="simpleConceptSummary" [ngClass]="getCSSClass()">{{textRepresentation}}</div>
`})
@Input()
export class SimpleConceptSummaryComponent {
    textRepresentation: string
    excluded: boolean

    getCSSClass() {
        return { 'excluded': this.excluded, }
    }
}

/* a Visitor (c.f. design patterns) which recursively visits constraints in order
*to create an HTML DOM representing those constraints for the side panel
*/
export class HTMLExportVisitor implements ConstraintVisitor<ComponentRef<any>> {

    constructor(private height: number, private componentFactoryResolver: ComponentFactoryResolver,
        private parentContainerRef: ViewContainerRef) {

    }

    private buildNewComponent<C>(componentType: Type<C>): ComponentRef<C> {
        return Utils.buildComponent(this.componentFactoryResolver, this.parentContainerRef, componentType)
    }

    // build a component which will wrap the simple text representation of the constraint.
    private buildSimpleTextComponent(c: Constraint): ComponentRef<any> {
        const componentRef = this.buildNewComponent(SimpleConceptSummaryComponent)
        const instance = componentRef.instance
        instance.excluded = c.excluded
        instance.textRepresentation = c.textRepresentation
        return componentRef
    }

    visitConstraint(c: Constraint): ComponentRef<any> {
        return this.buildSimpleTextComponent(c)
    }

    visitCombinationConstraint(cc: CombinationConstraint): ComponentRef<any> {
        const componentRef = this.buildNewComponent(CombinationConstraintSummaryComponent)
        const componentInstance = componentRef.instance
        componentInstance.state = cc.combinationState

        componentInstance.height = this.height
        componentInstance.children = []
        componentInstance.excluded = cc.excluded

        componentInstance.containerRef.subscribe(containerRef => {

            /* Building the children components.
            *The containerRef element is a reference to the DOM element which contain those children components.
            */
            cc.children.forEach((child, index) => {
                const childVisitor = new HTMLExportVisitor(this.height + 1, this.componentFactoryResolver, containerRef)
                console.log('Before child accept method', child)
                const childRef = child.accept(childVisitor)
                componentInstance.children.push(childRef)


                if ((index + 1) === cc.children.length) {
                    return
                }
                // add an operator component after the new child. This operator component displays the OR, AND in a pretty way
                componentInstance.addOperator();
            })

        })


        return componentRef
    }


    visitConceptConstraint(c: ConceptConstraint): ComponentRef<any> {
        const componentRef = this.buildNewComponent(PathDisplayerComponent)
        const componentInstance = componentRef.instance
        componentInstance.excluded = c.excluded
        componentInstance.path = Utils.extractDisplayablePath(c.treeNode)
        return componentRef
    }

    visitCohortConstraint(c: CohortConstraint): ComponentRef<any> {
        return this.buildSimpleTextComponent(c)
        // TODO create a bogus cohort to test this component
    }
    visitGenomicAnnotationConstraint(c: GenomicAnnotationConstraint): ComponentRef<any> {
        return this.buildSimpleTextComponent(c)
        // TODO create a bogus genomic annotation to test this component
    }
    visitTimeConstraint(c: TimeConstraint): ComponentRef<any> {
        return this.buildSimpleTextComponent(c)
    }
    visitValueConstraint(c: ValueConstraint): ComponentRef<any> {
        return this.buildSimpleTextComponent(c)
    }

}
