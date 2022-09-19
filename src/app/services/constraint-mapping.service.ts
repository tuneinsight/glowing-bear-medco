import { Constraint } from '../models/constraint-models/constraint';
import { ApiI2b2Panel } from '../models/api-request-models/medco-node/api-i2b2-panel';
import { Injectable } from '@angular/core';
import { CombinationConstraint } from '../models/constraint-models/combination-constraint';
import { CombinationState } from '../models/constraint-models/combination-state';
import { ApiI2b2Item } from '../models/api-request-models/medco-node/api-i2b2-item';
import { ConceptConstraint } from '../models/constraint-models/concept-constraint';
import { CohortConstraint } from '../models/constraint-models/cohort-constraint';
import { GenomicAnnotationConstraint } from '../models/constraint-models/genomic-annotation-constraint';
import { ValueType } from '../models/constraint-models/value-type';
import { CryptoService } from './crypto.service';
import { ErrorHelper } from '../utilities/error-helper';
import {ApiI2b2Timing} from '../models/api-request-models/medco-node/api-i2b2-timing';
import {TextOperator} from '../models/constraint-models/text-operator';
import {NumericalOperator} from '../models/constraint-models/numerical-operator';
import {ApiI2B2Modifier} from '../models/api-request-models/medco-node/api-i2b2-modifier';
import {Concept} from '../models/constraint-models/concept';

@Injectable()
export class ConstraintMappingService {

  constructor(private cryptoService: CryptoService) { }

  public mapConstraint(constraint: Constraint, queryTimingSameInstance: boolean): ApiI2b2Panel[] {
    let panels = [];
    this.mapCombinationConstraint(panels, constraint as CombinationConstraint, queryTimingSameInstance);
    return panels;
  }

  private mapCombinationConstraint(panels: ApiI2b2Panel[], constraint: Constraint, queryTimingSameInstance: boolean) {

    switch (constraint.className) {
      case 'CombinationConstraint':
        if ((constraint as CombinationConstraint).children.length === 0) {
          return;
        } else if ((constraint as CombinationConstraint).combinationState === CombinationState.Or) {
          panels.push(this.generateI2b2Panel(constraint, queryTimingSameInstance));
        } else if ((constraint as CombinationConstraint).combinationState === CombinationState.And) {
          (constraint as CombinationConstraint).children.forEach((childConstraint) =>
            this.mapCombinationConstraint(panels, childConstraint as CombinationConstraint, queryTimingSameInstance))
        }
        break;

      default: // should be ConceptConstraint or GenomicAnnotationConstraint
        panels.push(this.generateI2b2Panel(constraint, queryTimingSameInstance));
        break;
    }
  }

  /**
   * Handles both cases where there is only one item in a panel (no intermediate CombinationConstraint), and
   * when there are more than one.
   *
   * @param constraint
   * @param negated
   */
  private generateI2b2Panel(constraint: Constraint, queryTimingSameInstance: boolean): ApiI2b2Panel {
    let panel = new ApiI2b2Panel();

    panel.timing = constraint.panelTimingSameInstance && queryTimingSameInstance ? ApiI2b2Timing.sameInstanceNum : ApiI2b2Timing.any
    panel.not = constraint.excluded;

    switch (constraint.className) {
      case 'ConceptConstraint':
        const conceptConstraint = constraint as ConceptConstraint;
        if (conceptConstraint.concept) {
          panel.conceptItems.push(this.generateI2b2ItemFromConcept(conceptConstraint));
        }
        break;

      case 'GenomicAnnotationConstraint':
        panel.conceptItems.push(...this.generateI2b2ItemsFromGenomicAnnotation(constraint as GenomicAnnotationConstraint));
        break;

      case 'CombinationConstraint':
        let combConstraint = constraint as CombinationConstraint;
        if (combConstraint.combinationState !== CombinationState.Or) {
          throw ErrorHelper.handleNewError('combination state should be OR');
        }

        for (let i in combConstraint.children) {
          switch (combConstraint.children[i].className) {
            case 'ConceptConstraint':
              const childConceptConstraint = combConstraint.children[i] as ConceptConstraint;
              if (childConceptConstraint.concept) {
                panel.conceptItems.push(this.generateI2b2ItemFromConcept(childConceptConstraint));
              }
              break;

            case 'GenomicAnnotationConstraint':
              panel.conceptItems.push(
                ...this.generateI2b2ItemsFromGenomicAnnotation(combConstraint.children[i] as GenomicAnnotationConstraint)
              );
              break;

            case 'CohortConstraint':
              panel.cohortItems.push((combConstraint.children[i] as CohortConstraint).cohort.exploreQueryId);
              break;


            default:
              throw ErrorHelper.handleNewError(`unexpected constraint type (${combConstraint.children[i].className})`)
          }
        }
        break;

      default:
        throw ErrorHelper.handleNewError(`illegal constraint (${constraint.className})`);
    }

    console.log(`Generated i2b2 panel with ${panel.conceptItems.length} items`, panel);
    return panel;
  }

  private generateI2b2ItemFromConcept(constraint: ConceptConstraint): ApiI2b2Item {
    if (!(constraint.concept instanceof Concept)) {
      throw ErrorHelper.handleNewUserInputError(`Invalid query term "${constraint.concept}"`);
    }

    let item = new ApiI2b2Item();

    if (constraint.concept.encryptionDescriptor && constraint.concept.encryptionDescriptor.encrypted) {
      // todo: children IDs implementation
      item.encrypted = true;
      item.queryTerm = this.cryptoService.encryptIntegerWithCothorityKey(constraint.concept.encryptionDescriptor.id);

    } else {
      item.encrypted = false;
      item.queryTerm = constraint.concept.path;
      if (constraint.concept.modifier) {
        item.modifier = new ApiI2B2Modifier();
        item.queryTerm = constraint.concept.modifier.appliedConceptPath;
        item.modifier.key = constraint.concept.modifier.path;
        item.modifier.appliedPath = constraint.concept.modifier.appliedPath;
      }

      switch (constraint.concept.type) {
        case ValueType.SIMPLE:
          break;

        case ValueType.NUMERICAL:
          item.type = 'NUMBER'
          if (constraint.applyNumericalOperator && (constraint.numericalOperator)) {
            item.operator = constraint.numericalOperator
            item.value = ''

            switch (constraint.numericalOperator) {
              case NumericalOperator.BETWEEN:

                item.value = constraint.minValue.toString() + ' and ' + constraint.maxValue.toString()
                break;

              case NumericalOperator.EQUAL:
              case NumericalOperator.GREATER:
              case NumericalOperator.GREATER_OR_EQUAL:
              case NumericalOperator.LOWER:
              case NumericalOperator.LOWER_OR_EQUAL:
              case NumericalOperator.NOT_EQUAL:

                item.value = constraint.numValue.toString();
                break;

              default:
                throw ErrorHelper.handleNewUserInputError(`Numerical operator: ${constraint.numericalOperator} not handled.`);
            }
          }
          break;

        case ValueType.TEXT:
          item.type = 'TEXT'
          if (constraint.applyTextOperator && (constraint.textOperator)) {
            switch (constraint.textOperator) {
              case TextOperator.LIKE_EXACT:
              case TextOperator.LIKE_BEGIN:
              case TextOperator.LIKE_CONTAINS:
              case TextOperator.LIKE_END:
                item.operator = constraint.textOperator;
                item.value = constraint.textOperatorValue;
                break;

              case TextOperator.IN:
                item.operator = constraint.textOperator;
                item.value = constraint.textOperatorValue.split(',').map(substring => '\'' + substring + '\'').join(',');
                break;

              default:
                throw ErrorHelper.handleNewUserInputError(`Text operator: ${constraint.textOperator} not handled.`);
            }
          }
          break;

        default:
          throw ErrorHelper.handleNewUserInputError(`Concept type not supported: ${constraint.concept.type.toString()}.`);
      }
    }

    console.log(`Generated i2b2 item ${item.queryTerm}.`, item)
    return item;
  }

  private generateI2b2ItemsFromGenomicAnnotation(constraint: GenomicAnnotationConstraint): ApiI2b2Item[] {
    return constraint.variantIds.map((variantId) => {
      let item = new ApiI2b2Item();
      item.encrypted = true;
      item.queryTerm = variantId; // todo: variant IDs are pre-encrypted
      return item;
    });
  }
}
