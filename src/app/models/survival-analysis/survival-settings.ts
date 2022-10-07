/**
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Granularity } from './granularity-type';

export class SurvivalSettings {
  public cohortName: string

  constructor(
    public timeGranularity: Granularity,
    public timeLimit: number,
    public startEvent: string,
    public startsWhen: string,
    public endEvent: string,
    public endsWhen: string,
    public subGroupTextRepresentations: {
      groupId: string,
      rootSelectionConstraint?: string,
      rootSequentialConstraint?: string
    }[]
  ) { }

  mainSettingsToTable(): { headers: string[][], data: string[][] } {
    let headers = [['Name', 'Value']]
    let data = new Array<string[]>(7)
    data[0] = ['cohort name', `${this.cohortName}`]
    data[1] = ['time granularity', `${this.timeGranularity}`]
    data[2] = ['time limit (in unit defined in granularity)', `${this.timeLimit}`]
    data[3] = ['start event', `${this.startEvent}`]
    data[4] = ['starts when', `${this.startsWhen}`]
    data[5] = ['end event', `${this.endEvent}`]
    data[6] = ['ends when', `${this.endsWhen}`]


    return { headers: headers, data: data }
  }

  subGroupsToTable(): { headers: string[][], data: string[][] } {
    let headers = [['Group', 'Definition']]
    let data = new Array<string[]>()
    this.subGroupTextRepresentations.forEach(
      sg => {
        if (sg.rootSelectionConstraint) {
          let constraintText = sg.rootSelectionConstraint
          if (sg.rootSequentialConstraint) {
            constraintText = 'Selection Constraint: (' + sg.rootSelectionConstraint + ')\n' +
              'Sequential Constraint:(' + sg.rootSequentialConstraint + ')'
          }
          data.push([sg.groupId, constraintText])

        } else {
          console.warn(`in formatting sub-group definitions: sub-group ${sg.groupId} has no definition ` +
            'This is not supposed to happen.')
        }
      }
    )

    return { headers: headers, data }

  }

}
