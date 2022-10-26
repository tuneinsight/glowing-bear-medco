import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GbCombinationConstraintComponent } from '../constraint-components/gb-combination-constraint/gb-combination-constraint.component';
import { GbConstraintComponent } from '../constraint-components/gb-constraint/gb-constraint.component';
import { GbConceptConstraintComponent } from '../constraint-components/gb-concept-constraint/gb-concept-constraint.component';
import { GbCohortConstraintComponent } from '../constraint-components/gb-cohort-constraint/gb-cohort-constraint.component';
import { GbGenomicAnnotationConstraintComponent } from '../constraint-components/gb-genomic-annotation-constraint/gb-genomic-annotation-constraint.component';
import { GbSelectionComponent } from './gb-selection.component';
import { AccordionModule, TooltipModule } from 'primeng';
import { InputNumberModule } from 'primeng';
import { DropdownModule } from 'primeng';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng';
import { CheckboxModule } from 'primeng';
import { CalendarModule } from 'primeng';
import { PanelModule } from 'primeng';
import { MultiSelectModule } from 'primeng';
import { GbTooltipComponent } from '../constraint-components/gb-concept-constraint/gb-tooltip/gb-tooltip.component';
import { GbUtilsModule } from '../../gb-utils-module/gb-utils.module';
import { GbTemporalSequenceComponent } from '../constraint-components/gb-sequential-constraint/gb-temporal-sequence/gb-temporal-sequence.component';
import { GbCompositeConstraintComponent } from '../constraint-components/gb-composite-constraint/gb-composite-constraint.component';
import { GbSequentialConstraintComponent } from '../constraint-components/gb-sequential-constraint/gb-sequential-constraint.component';



@NgModule({
  declarations: [
    GbCombinationConstraintComponent,
    GbCompositeConstraintComponent,
    GbSequentialConstraintComponent,
    GbTemporalSequenceComponent,
    GbConstraintComponent,
    GbConceptConstraintComponent,
    GbTooltipComponent,
    GbCohortConstraintComponent,
    GbGenomicAnnotationConstraintComponent,
    GbSelectionComponent
  ],
  imports: [
    CommonModule,
    AccordionModule,
    FormsModule,
    InputNumberModule,
    AutoCompleteModule,
    CheckboxModule,
    CalendarModule,
    DropdownModule,
    PanelModule,
    MultiSelectModule,
    TooltipModule,
    GbUtilsModule
  ],
  exports: [
    GbCombinationConstraintComponent,
    GbCompositeConstraintComponent,
    GbSequentialConstraintComponent,
    GbConstraintComponent,
    GbConceptConstraintComponent,
    GbTooltipComponent,
    GbCohortConstraintComponent,
    GbGenomicAnnotationConstraintComponent,
    GbSelectionComponent
  ]
})
export class GbSelectionModule { }
