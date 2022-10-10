import { Component, ElementRef, OnInit } from '@angular/core';
import { DialogService, DynamicDialogConfig } from 'primeng';
import { Subject } from 'rxjs';
import { delay, startWith } from 'rxjs/operators';
import { AppConfig } from 'src/app/config/app.config';
import { ApiI2b2SequentialOperator } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { ApiI2b2When } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-when';
import { SequentialConstraint } from 'src/app/models/constraint-models/sequential-constraint';
import { GenomicAnnotationsService } from 'src/app/services/api/genomic-annotations.service';
import { CohortService } from 'src/app/services/cohort.service';
import { ConstraintService } from 'src/app/services/constraint.service';
import { QueryService } from 'src/app/services/query.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';
import { GbCompositeConstraintComponent } from '../gb-composite-constraint/gb-composite-constraint.component';
import { GbTemporalSequenceComponent } from './gb-temporal-sequence/gb-temporal-sequence.component';

@Component({
  selector: 'gb-sequential-constraint',
  templateUrl: './gb-sequential-constraint.component.html',
  styleUrls: ['./gb-sequential-constraint.component.css', '../gb-composite-constraint/gb-composite-constraint.component.css', '../gb-constraint/gb-constraint.component.css']
})
export class GbSequentialConstraintComponent extends GbCompositeConstraintComponent implements OnInit {

  // onClose is not firing from the dynamic dialog, a "hand-made" RXJS subject is thus required
  _sequenceInfoSubject: Subject<ApiI2b2SequentialOperator>;

  constructor(protected treeNodeService: TreeNodeService,
              protected cohortService: CohortService,
              protected constraintService: ConstraintService,
              protected queryService: QueryService,
              protected genomicAnnotationsService: GenomicAnnotationsService,
              protected element: ElementRef,
              protected config: AppConfig,
              protected dialogService: DialogService) {
    super(treeNodeService, cohortService, constraintService, queryService, genomicAnnotationsService, element, config, dialogService)
  }
  ngOnInit(): void {
  }

  get temporalSequence(): ApiI2b2SequentialOperator[] {
    return (this.constraint as SequentialConstraint).temporalSequence
  }


  temporalStringRepresentation(operator: ApiI2b2When): string {
    switch (operator) {
      case ApiI2b2When.lessequal:
        return 'before or same time as'
      case ApiI2b2When.equal:
        return 'same time as'
      case ApiI2b2When.less:
      default:
        return 'before'
    }
  }


  showTemporal(idx: number) {
    let config = new DynamicDialogConfig()
    let currentSequence = (!(this.temporalSequence) || (this.temporalSequence.length === 0)) ?
      new ApiI2b2SequentialOperator() : this.temporalSequence[idx]
    this._sequenceInfoSubject = new Subject<ApiI2b2SequentialOperator>()
    this._sequenceInfoSubject
      .pipe(
        // without this two following lines, a 'Expression has changed after it was checked'
        // solution at https://blog.angular-university.io/angular-debugging/
        startWith(currentSequence),
        delay(0))
      .subscribe(info => {
          if (!(this.temporalSequence) || (this.temporalSequence.length === 0)) {
            (this.constraint as SequentialConstraint).temporalSequence = new Array<ApiI2b2SequentialOperator>(this.children.length - 1)
            this.temporalSequence.forEach((_, index) => this.temporalSequence[index] = new ApiI2b2SequentialOperator())
          }
          this.temporalSequence[idx] = info
        }
      )
    config.data = {
      sequenceInfo: currentSequence,
      sequenceInfoSubject: this._sequenceInfoSubject,
    }
    config.header = 'Define advanced temporal sequence operator'

    this.dialogService.open(GbTemporalSequenceComponent, config)
  }

}
