/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export enum TextOperator {
  IN = 'IN',
  LIKE_EXACT = 'LIKE[exact]',
  LIKE_BEGIN = 'LIKE[begin]',
  LIKE_END = 'LIKE[end]',
  LIKE_CONTAINS = 'LIKE[contains]',
}
