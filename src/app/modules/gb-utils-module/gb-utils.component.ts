import { ChangeDetectorRef, Component, Input } from '@angular/core'

export const includedExcludedCSS = `
.excluded {
    background-color: #a83c3c;
    color: white;
    border-radius: 1em;
    width: fit-content;
}
`

@Component({
    selector: 'gb-path-displayer',
    styles: [
        `
        li {
            display: inline-block;
        }
        .delimiter {
            padding-right: .5em;
        }
        ul {
            padding-left: 2em;
        }
    `,
        includedExcludedCSS
    ],
    template: `
    <div [ngClass]="getCSSClass()">
        <ul>
            <li *ngFor="let elem of pathElements; let i = index">
                <span> {{elem}} </span>
                <span *ngIf="!isLastElement(i)" class="delimiter"> &gt; </span>
            </li>
        </ul>
    </div>
    `
})
export class PathDisplayerComponent {
    @Input()
    excluded: boolean

    @Input()
    pathElements: string[] = []

    constructor(private ref: ChangeDetectorRef) { }

    isLastElement(index: number): boolean {
        return this.pathElements.length === (index + 1)
    }

    getCSSClass() {
        if (this.excluded === undefined) {
            return {}
        }
        return { 'excluded': this.excluded, }
    }

    set path(pathElements: string[]) {
        this.pathElements = pathElements
        this.ref.detectChanges()
    }
}
