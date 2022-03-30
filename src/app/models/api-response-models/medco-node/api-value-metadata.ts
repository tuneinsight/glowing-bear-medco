/**
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export class ApiValueMetadata {
  creationDateTime: string;
  dataType: string;
  okToUseValues: "Y" | "N";
  testID: string;
  testName: string;
  version: string;
  unitValues: UnitValues[];
}

export enum DataType {
  POS_INTEGER = 'PosInteger',
  INTEGER = 'Integer',
  FLOAT = 'Float',
  POS_FLOAT = 'PosFloat',
  ENUM = 'Enum',
  STRING = 'String'
}

class UnitValues {
  normalUnits: string
  equalUnits: string[]
  convertingUnits: ConvertingUnit[]
  excludingUnits: string[]

}

class ConvertingUnit {
  multiplyingFactor: string
  units: string
}
