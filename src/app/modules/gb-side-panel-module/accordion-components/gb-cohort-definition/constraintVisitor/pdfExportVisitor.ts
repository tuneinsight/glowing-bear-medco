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






/* a Visitor (c.f. design patterns) which recursively visits constraints in order
* to create a text representing those constraints for the pdf export functionality.
* The text is represented as a list of string. Each element of the list is one line of the text.
*/
export class PdfExportVisitor implements ConstraintVisitor<string[]> {

    constructor(private numberOfTabs: number = 0) {

    }

    private getTabs(): string {
        let tabs = ''
        for (let i = 0; i < this.numberOfTabs; i++) {
            tabs += '\t'
        }
        return tabs
    }

    // build a component which will wrap the simple text representation of the constraint.
    private buildSimpleTextComponent(c: Constraint): string[] {
        return this.printLine(c.textRepresentation)
    }

    private printLine(txt: string): string[] {
        return [this.getTabs() + txt]
    }

    visitConstraint(c: Constraint): string[] {
        return this.buildSimpleTextComponent(c)
    }

    visitCombinationConstraint(cc: CombinationConstraint): string[] {
        let output = []
        if (cc.excluded) {
            output = output.concat(this.printLine('Excluded: {'))
            this.numberOfTabs++
        }

        cc.children.forEach((child, index) => {
            const v = new PdfExportVisitor(this.numberOfTabs + 1)
            const childOutput = child.accept(v)
            output = output.concat(childOutput)

            if ((index + 1) === cc.children.length) {
                return
            }

            let combinationState = ''
            switch (cc.combinationState) {
                case CombinationState.And:
                    combinationState = 'AND'
                    break
                case CombinationState.Or:
                    combinationState = 'OR'
                    break
                default:
                    combinationState = 'unknown'
            }

            output = output.concat(this.printLine(combinationState))

        })

        if (cc.excluded) {
            this.numberOfTabs--
            output = output.concat(this.printLine('}'))
        }
        return output
    }


    visitConceptConstraint(c: ConceptConstraint): string[] {
        const path = Utils.extractDisplayablePath(c.treeNode).reduce((e1, e2) => e1 + ' > ' + e2)
        const txt = (c.excluded ? ' Excluded: ' : '') + path
        return this.printLine(txt)
    }

    visitCohortConstraint(c: CohortConstraint): string[] {
        return this.buildSimpleTextComponent(c)
    }
    visitGenomicAnnotationConstraint(c: GenomicAnnotationConstraint): string[] {
        return this.buildSimpleTextComponent(c)
    }
    visitTimeConstraint(c: TimeConstraint): string[] {
        return this.buildSimpleTextComponent(c)
    }
    visitValueConstraint(c: ValueConstraint): string[] {
        return this.buildSimpleTextComponent(c)
    }

}
