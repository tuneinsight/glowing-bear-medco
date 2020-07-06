/**
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function identity(sigma:number,point:{timePoint:number,prob:number,cumul:number,remaining:number}) :{inf:number,sup:number}{
    var limes= point.cumul * point.prob * point.prob
    limes=Math.sqrt(limes)
    return {inf: point.prob - sigma*limes, sup: point.prob + sigma*limes}
  }
  
export function logarithm(sigma:number,point:{timePoint:number,prob:number,cumul:number,remaining:number}):{inf:number,sup:number}{
    var limes=point.cumul
    limes=Math.sqrt(limes)
    return {inf: point.prob*Math.exp( - sigma*limes), sup: point.prob *Math.exp( sigma*limes)}
  
  
  }
  
export function logarithmMinusLogarithm(sigma:number,point:{timePoint:number,prob:number,cumul:number,remaining:number}):{inf:number,sup:number}{
  
    var limes = (point.prob ==0 || point.prob == 1) ? 0:point.cumul/(Math.pow(Math.log(point.prob),2))
    limes=Math.sqrt(limes)
    return {inf: Math.pow(point.prob , Math.exp(sigma*limes)), sup: Math.pow(point.prob, Math.exp(- sigma*limes))}
  
  
  }
  
export function arcsineSquaredRoot(sigma:number,point:{timePoint:number,prob:number,cumul:number,remaining:number}): {inf:number,sup:number}{
    var limes = (point.prob==1) ? 0: 0.25 * point.prob/(1-point.prob) *point.cumul
    var transformed=Math.asin(Math.sqrt(point.prob))
    limes = Math.sqrt(limes)
    return {inf: Math.pow(Math.sin(transformed - sigma * limes),2.0) , sup:Math.pow(Math.sin(transformed + sigma * limes),2.0)}
  }