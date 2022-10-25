/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver,
  ComponentRef, Input, OnDestroy, Type, ViewChild, ViewContainerRef
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { TreeNode } from 'src/app/models/tree-models/tree-node';
import { ChartInformation, ConfidenceInterval, ExploreStatisticsService } from '../../../../services/explore-statistics.service';
import { ChartComponent, HistogramChartComponent, LineChartComponent } from './gb-chart.component';
import { PDF } from 'src/app/utilities/files/pdf';
import { ErrorHelper } from 'src/app/utilities/error-helper';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { QueryService } from 'src/app/services/query.service';
import { GbSelectionComponent } from 'src/app/modules/gb-explore-module/gb-selection-component/gb-selection.component';
import assert from 'assert';
import { PdfExportVisitor } from 'src/app/modules/gb-side-panel-module/accordion-components/gb-cohort-definition/constraintVisitor/pdfExportVisitor';
import { CombinationConstraint } from 'src/app/models/constraint-models/combination-constraint';

const childFlexCss = './child-flex.css'
const resultsCss = './gb-explore-statistics-results.component.css'
const refIntervalCss = './gb-reference-interval.component.css'



const shortCopyright = `Copyright notice:
GMDN: GMDN ® is a registered trademark of The GMDN Agency. All rights reserved. The copyright and database rights in the original GMDN materials are owned by The GMDN Agency Ltd 2005-2022. Used under licence from The GMDN Agency Ltd.
GUDI: Global Unique Device Identification codes from the Global Unique Device Identification Database (GUDID) have been retrieved at the AccessGUDID-portal and are a courtesy of the the National Library of Medicine in collaboration with the U.S. Food and Drug Administration.
ICD-10-GM: © 2022 German Federal Institute for Drugs and Medical Devices (Bundesinstitut für Arzneimittel und Medizinprodukte BfArM) on behalf of the German Federal Ministry of Health (Bundesministerium für Gesundheit BMG) with the participation of the ICD Working Group of the Board of Trustees for Questions of Classification in Health Care (KKG)"
LOINC: LOINC is copyright © 1995-2022, Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at https://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.
SNOMED CT: SNOMED CT is copyright © SNOMED International 2021 v3.15.1., SNOMED CT international. See license details.
UCUM: The Unified Code for Units of Measure (UCUM), also known as the “UCUM Specification,” is copyright ©1999-2021, Regenstrief Institute, Inc., Inc. and The UCUM Organization, Indianapolis, IN. All rights reserved. See license details.`


export interface SVGConvertible {
  /*
  * print the current component to the pdf passed as parameter. Index is the index of the component in the parent component.
  * isLastInRow defines if the svg printed to the pdf is the last element of the current row in the pdf. If the element is the last in
  * the row some vertical margin will be appended after the element.
  **/
  printToPDF(pdf: PDF, index: number, isLastInRow: boolean): any
}

@Component({
  selector: 'gb-explore-statistics-results',
  templateUrl: './gb-explore-statistics-results.component.html',
  styleUrls: [resultsCss],
})
export class GbExploreStatisticsResultsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('exploreStatsCanvasContainer', { read: ViewContainerRef })
  canvasContainer: ViewContainerRef;

  private componentRefs: Array<ComponentRef<any>> = []

  private _displayLoadingIcon = false

  private exportPDFSubscription: Subscription

  // instantiated reference interval components visible within the view of the GbExploreStatisticsResultsComponent
  private refIntervalsComponents: ReferenceIntervalComponent[]
  private rootConstraint: CombinationConstraint;

  constructor(private exploreStatisticsService: ExploreStatisticsService,
    private authService: AuthenticationService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private queryService: QueryService,
    private cdref: ChangeDetectorRef) {

    this.exploreStatisticsService.rootConstraint.subscribe(constraint => {
      this.rootConstraint = constraint
    })


    this.exportPDFSubscription = this.exploreStatisticsService.exportPDF.subscribe(_ => {
      this.exportPDF();
    })

  }



  private exportPDF() {

    if (this.refIntervalsComponents === undefined || this.refIntervalsComponents.length <= 0) {
      throw ErrorHelper.handleNewError('No PDF report to export. Please first execute a query.');
    }
    let nbColumn = 1.1
    if (this.refIntervalsComponents.length > 1) {
      nbColumn = 2
    }
    const pdf = new PDF(nbColumn, 8, -3);

    const date = new Date();
    pdf.addOneLineText(
      'Date of export (d/m/y): '
      + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
      + ' - generated by: ' + this.authService.username, 0);

    const addEmptyLine = () => { for (let i = 0; i < pdf.nbOfColumns; i++) { pdf.addOneLineText(' ', i); } };

    for (let i = 0; i < 2; i++) { addEmptyLine() }

    this.refIntervalsComponents.forEach((c, i) => c.toPDF(pdf, i));

    const timingValue = this.queryService.queryTiming;
    const chosenTiming = GbSelectionComponent.timings.filter(t => t.value === timingValue);
    assert(chosenTiming.length > 0);
    pdf.addOneLineText('Counting method: ' + chosenTiming[0].label, 0);
    pdf.addOneLineText('Constraints on cohort: ')

    const visitor = new PdfExportVisitor();
    const constraintsSummary = this.rootConstraint.accept(visitor);

    constraintsSummary.forEach(constraint => {
      pdf.addTableFromObjects(null, [[constraint]], null, 0)
    })

    for (let i = 0; i < 3; i++) {
      addEmptyLine()
    }

    pdf.addContentText([shortCopyright])

    pdf.export('TI4Health_Report_Export_' + new Date().toJSON().replace('T', '_').replace(/:/g, '-').slice(0, 19) + '.pdf');
  }

  private displayCharts(chartsInfo: ChartInformation[]) {


    // Clean the content of the canvas container: remove the previous charts from the canvas container
    this.canvasContainer.clear()

    this.refIntervalsComponents = chartsInfo.map(chartInfo => {

      // //create a histogram
      // this.buildChart(chartInfo, HistogramChartComponent)

      // // create a smooth line graph
      // this.buildChart(chartInfo, LineChartComponent)

      // this.buildReferenceInterval(chartInfo, ReferenceIntervalHistogram)
      return this.buildReferenceInterval(chartInfo, ReferenceIntervalLineComponent)

    });

  }


  private buildReferenceInterval<R extends ReferenceIntervalComponent>(chartInfo: ChartInformation, refIntervalType: Type<R>): R {
    const componentRef = Utils.buildComponent(this.componentFactoryResolver, this.canvasContainer, refIntervalType)
    this.componentRefs.push(componentRef)

    const component = componentRef.instance
    component.chartInfo = chartInfo

    return component
  }

  get displayLoadingIcon() {
    return this._displayLoadingIcon
  }

  ngOnInit() {
    Chart.register(annotationPlugin);
    Chart.register(...registerables) // for the x and y scales options in the config of chart js

    this.exploreStatisticsService.displayLoadingIcon.subscribe((display: boolean) => {
      this._displayLoadingIcon = display
      this.cdref.detectChanges();
    })
  }

  ngAfterViewInit() {
    this.exploreStatisticsService.chartsDataSubject.subscribe((chartsInfo: ChartInformation[]) => {
      this.displayCharts(chartsInfo);
    })
  }

  ngOnDestroy() {
    if (this.exportPDFSubscription !== undefined && this.exportPDFSubscription !== null) {
      this.exportPDFSubscription.unsubscribe()
    }
    this.componentRefs.forEach(element => {
      element.destroy()
    });
  }

}

export class Utils {
  public static buildComponent<C>(componentFactoryResolver: ComponentFactoryResolver,
    newComponentContainer: ViewContainerRef, componentType: Type<C>): ComponentRef<C> {
    const componentFactory = componentFactoryResolver.resolveComponentFactory(componentType);
    return newComponentContainer.createComponent(componentFactory);
  }


  public static buildChart<C extends ChartComponent>(componentFactoryResolver: ComponentFactoryResolver,
    newComponentContainer: ViewContainerRef, chartInfo: ChartInformation, componentType: Type<C>): ComponentRef<C> {
    const componentRef = Utils.buildComponent(componentFactoryResolver, newComponentContainer, componentType)

    const component = componentRef.instance
    component.chartInfo = chartInfo

    return componentRef
  }

  // retrieving the display name of the ancestors tree nodes and assemble those display name in a list
  static extractDisplayablePath(treeNode: TreeNode): string[] {
    let currentNode: TreeNode = treeNode
    let displayNames: string[] = []
    for (; true;) {
      if (currentNode === undefined || currentNode === null) {
        break;
      }
      displayNames.push(currentNode.displayName)
      currentNode = currentNode.parent
    }

    return displayNames.reverse()
  }

}


const referenceIntervalTemplate = './gb-reference-interval.component.html';
@Component({
  templateUrl: referenceIntervalTemplate,
  styleUrls: [refIntervalCss, resultsCss, childFlexCss],
  host: {
    '[class.hidden]': 'hide' // https://stackoverflow.com/questions/61965535/apply-css-class-conditionally-to-angular-component-host
  }
})
export abstract class ReferenceIntervalComponent implements OnDestroy {

  @ViewChild('chartContainer', { read: ViewContainerRef }) chartContainer: ViewContainerRef;


  @Input()
  middleCI1: number
  @Input()
  middleCI1_full: number
  @Input()
  lowBoundCI1: number
  @Input()
  highBoundCI1: number

  @Input()
  middleCI2: number
  @Input()
  middleCI2_full: number
  @Input()
  lowBoundCI2: number
  @Input()
  highBoundCI2: number

  @Input()
  CI2: ConfidenceInterval

  private _chartInfo: ChartInformation

  /* An angular reference to the component contained in this component.
  * The chartComponentRef contains graphical information about the chart.
  */
  private chartComponentRef: ComponentRef<ChartComponent>

  protected chartType: Type<ChartComponent>;

  @Input() hide = false

  private chartBuilt = false


  constructor(private componentFactoryResolver: ComponentFactoryResolver) {

  }

  private buildChart<C extends ChartComponent>(chartInfo: ChartInformation, componentType: Type<C>) {
    const componentRef = Utils.buildChart(this.componentFactoryResolver, this.chartContainer, chartInfo, componentType)
    this.chartComponentRef = componentRef
    const CI1 = chartInfo.CI1
    const CI2 = chartInfo.CI2

    this.middleCI1 = parseFloat(CI1.middle.toPrecision(5));
    this.middleCI1_full = CI1.middle;
    this.lowBoundCI1 = CI1.lowerBound
    this.highBoundCI1 = CI1.higherBound

    this.middleCI2 = parseFloat(CI2.middle.toPrecision(5));
    this.middleCI2_full = CI2.middle;
    this.lowBoundCI2 = CI2.lowerBound
    this.highBoundCI2 = CI2.higherBound
  }


  // print the current component to the pdf passed as parameter. Index is the index of the component in the parent component
  toPDF(pdf: PDF, index: number) {
    if (!this.chartBuilt) {
      return
    }
    if (this.chartComponentRef === undefined) {
      throw ErrorHelper.handleNewError('No PDF report to export. Please first execute a query.');
    }


    const columnIndex = index % pdf.nbOfColumns

    pdf.addOneLineText(`Reference Interval Report for ${this.numberOfObservations()} entries`, columnIndex, pdf.headersSize + 5)
    pdf.addVerticalMargin(2, columnIndex)
    this.chartComponentRef.instance.printToPDF(pdf, columnIndex)
    pdf.addOneLineText('The 95% reference interval (90% confidence) is: ', columnIndex)
    const referenceInterval = `${this.middleCI1} (${this.lowBoundCI1}-${this.highBoundCI1}) - ${this.middleCI2} (${this.lowBoundCI2}-${this.highBoundCI2})`
    pdf.addTableFromObjects(null, [[referenceInterval]], null, columnIndex)
    pdf.addVerticalMargin(8, columnIndex)
  }

  ngAfterViewInit() {
    this.buildChart(this._chartInfo, this.chartType)
    this.chartBuilt = true
  }


  remove() {
    this.hide = true
  }

  ngOnDestroy(): void {
    this.chartComponentRef.destroy()
  }

  numberOfObservations() {
    return this._chartInfo.numberOfObservations()
  }

  public set chartInfo(chartInfo: ChartInformation) {
    this._chartInfo = chartInfo
  }

}

@Component({
  templateUrl: referenceIntervalTemplate,
  styleUrls: [refIntervalCss, resultsCss, childFlexCss],
})
export class ReferenceIntervalLineComponent extends ReferenceIntervalComponent {
  constructor(componentFactoryResolver: ComponentFactoryResolver) {
    super(componentFactoryResolver)
    this.chartType = LineChartComponent
  }
}

@Component({
  templateUrl: referenceIntervalTemplate,
  styleUrls: [refIntervalCss, resultsCss, childFlexCss],
})
export class ReferenceIntervalHistogramComponent extends ReferenceIntervalComponent {
  constructor(componentFactoryResolver: ComponentFactoryResolver) {
    super(componentFactoryResolver)
    this.chartType = HistogramChartComponent
  }
}


