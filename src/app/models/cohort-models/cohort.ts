/**
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CombinationConstraint } from '../constraint-models/combination-constraint'

import { ApiQueryDefinition } from '../api-request-models/medco-node/api-query-definition'
import { SequentialConstraint } from '../constraint-models/sequential-constraint'

export class Cohort {
  private _name: string
  private _exploreQueryId: string;
  private _queryDefinition: ApiQueryDefinition

  public selected: boolean
  private _creationDate: Date
  private _updateDate: Date

  public bookmarked: boolean
  public visible: boolean


  private _rootSelectionConstraint: CombinationConstraint
  private _rootSequentialConstraint: SequentialConstraint

  constructor(
    name: string,
    rootSelectionConstraint: CombinationConstraint,
    rootSequentialConstraint: SequentialConstraint,
    createDate: Date,
    updateDate: Date
  ) {
    this._name = name

    if (rootSelectionConstraint !== null) {
      this._rootSelectionConstraint = rootSelectionConstraint.clone()
    }

    if (rootSequentialConstraint !== null) {
      this._rootSequentialConstraint = rootSequentialConstraint.clone()
    }

    if (createDate) {
      this._creationDate = createDate
    }

    if (updateDate) {
      this._updateDate = createDate
    }

    this.selected = false
    this.visible = true
  }

  get name(): string {
    return this._name
  }

  get rootSelectionConstraint(): CombinationConstraint {
    if (this._rootSelectionConstraint) {
      let cpy = new CombinationConstraint
      cpy.parentConstraint = this._rootSelectionConstraint.parentConstraint

      cpy.children = this._rootSelectionConstraint.children
      cpy.combinationState = this._rootSelectionConstraint.combinationState
      cpy.isRoot = this._rootSelectionConstraint.isRoot

      return cpy
    } else {
      return null
    }
  }

  set rootSelectionConstraint(constr: CombinationConstraint) {
    if (constr) {
      let cpy = new CombinationConstraint
      cpy.parentConstraint = constr.parentConstraint

      cpy.children = constr.children
      cpy.combinationState = constr.combinationState
      cpy.isRoot = constr.isRoot

      this._rootSelectionConstraint = cpy

    } else {
      this._rootSelectionConstraint = null
    }
  }

  get rootSequentialConstraint(): SequentialConstraint {
    if (this._rootSequentialConstraint) {
      let cpy = new SequentialConstraint
      cpy.parentConstraint = this._rootSequentialConstraint.parentConstraint

      cpy.children = this._rootSequentialConstraint.children

      cpy.isRoot = this._rootSequentialConstraint.isRoot

      return cpy
    } else {
      return null
    }
  }

  set rootSequentialConstraint(constr: SequentialConstraint) {
    if (constr) {
      let cpy = new SequentialConstraint
      cpy.parentConstraint = constr.parentConstraint

      cpy.children = constr.children

      cpy.isRoot = constr.isRoot

      this._rootSequentialConstraint = cpy

    } else {
      this._rootSequentialConstraint = null
    }
  }

  set name(n: string) {
    this._name = n
  }

  set queryDefinition(qd: ApiQueryDefinition) {
    this._queryDefinition = qd
  }

  get queryDefinition(): ApiQueryDefinition {
    return this._queryDefinition
  }

  get creationDate(): Date {
    return this._creationDate
  }

  get updateDate(): Date {
    return this._updateDate
  }

  get exploreQueryId(): string {
    return this._exploreQueryId;
  }

  set exploreQueryId(value: string) {
    this._exploreQueryId = value;
  }



  /**
   * mostRecentQueryDefinitions returns the definition with the most recent
   */
  /*
  mostRecentQueryDefinition(): ApiQueryDefinition {
    let sortedDef = this.queryDefinition
      .filter(definition => ((definition !== null) || (definition !== undefined)))
      .map((definition, index) => { return { date: this.updateDate[index], definition: definition } })
      .sort((a, b) => (a.date < b.date) ? -1 : 1)

    if (sortedDef.length !== 0) {
      return sortedDef[sortedDef.length - 1].definition
    } else {
      return null
    }
  }*/

  /**
   * lastUpdateDate returns the most recent update date
   */
  /*lastUpdateDate(): Date {
    return this._updateDate.reduce((date1, date2) => (date1 > date2) ? date1 : date2)
  }*/

  /**
   * lastCreationDate returns the most recent creation date
   */
  /*lastCreationDate(): Date {
    return this._creationDate.reduce((date1, date2) => (date1 > date2) ? date1 : date2)
  }*/

}
