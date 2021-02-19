import { ChangeDetectorRef, Component, Input } from "@angular/core"

@Component({
    selector: 'path-displayer',
    styles: [
        `
        li {
            display: inline-block;
        }
        .delimiter {
            padding-right: .5em;
        }
        `,
        'ul {padding-left: 2em }'
    ],
    template: `
    <div>
        <ul>
            <li *ngFor="let elem of pathElements; let i = index">
                <span> {{elem}} </span>
                <span *ngIf="!isLastElement(i)" class="delimiter"> &gt; </span>
            </li>
        </ul>
    </div>
    `
})
export class PathDisplayer {
    @Input()
    pathElements: string[] = []

    constructor(private ref: ChangeDetectorRef) { }

    isLastElement(index: number): boolean {
        return this.pathElements.length === (index + 1)
    }

    set path(pathElements: string[]) {
        this.pathElements = pathElements
        this.ref.detectChanges()
    }
}