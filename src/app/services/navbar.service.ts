/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 EPFL LDS
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Subject, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router'
import {OperationType} from '../models/operation-models/operation-types';
import { AppConfig } from '../config/app.config';

@Injectable()
export class NavbarService {

  private _items: MenuItem[];
  private _activeItem: MenuItem;
  private _selectedSurvivalId: Subject<number>
  private _selectedSurvivalIDtoDelete: Subject<number>

  private _resultItems: MenuItem[];
  private _activeResultItem: MenuItem;

  private _isSelectProject = true;
  private _isExplore = false;
  private _isExploreStatistics = false;
  private _isExploreResults = false;
  private _isAnalysis = false;
  private _isResults = false;
  private _isSurvivalRes = false;

  private _lastSuccessfulSurvival: number;

  constructor(private authService: AuthenticationService,
    private router: Router,
    private appConfig: AppConfig) {
    this._selectedSurvivalId = new Subject<number>()
    this._selectedSurvivalIDtoDelete = new Subject<number>()

    this.init();
  }

  init() {
    const isBiorefMode = this.appConfig.getConfig('isBiorefMode');

    this.items = [

      // select project tab
      { label: OperationType.SELECT_PROJECT, routerLink: '/select-project' },

      // explore tab, default page
      { label: OperationType.EXPLORE, routerLink: '/explore', disabled: true },

      // explore statistics tab
      ...(isBiorefMode ? [{ label: OperationType.EXPLORE_STATISTICS, routerLink: '/explore-statistics', disabled: true }] : [
        // survival analysis tab
        { label: OperationType.ANALYSIS, routerLink: '/analysis', disabled: true },

        // results tab
        { label: OperationType.RESULTS, routerLink: '/results', disabled: true }
      ])
    ].map((item, index) => ({ ...item, label: `${index + 1}. ${item.label}` }));

    this.resultItems = [];
    this._lastSuccessfulSurvival = 0;

    this.navigateToSelectProjectTab();
  }

  updateNavbar(routerLink: string) {
    this.isSelectProject = (routerLink === '/select-project' || routerLink === '');
    this.isExplore = (routerLink === '/explore');
    this.isExploreStatistics = (routerLink === '/explore-statistics');
    this.isAnalysis = (routerLink === '/analysis');
    this.isResults = (routerLink === '/results');
    this.isSurvivalRes = false;
    for (let i = 0; i < this.resultItems.length; i++) {
      if (routerLink === this.resultItems[i].routerLink.toString()) {
        this.isSurvivalRes = true
        break
      }
    }

    console.log('Updated router link: ', routerLink)

    if (this.isSelectProject) {
      this.activeItem = this.items.find((item) => item.label.indexOf(OperationType.SELECT_PROJECT) !== -1);
    } else if (this.isExplore) {
      this.activeItem = this.items.find((item) => item.label.indexOf(OperationType.EXPLORE) !== -1);
    } else if (this.isExploreStatistics) {
      this.activeItem = this.items.find((item) => item.label.indexOf(OperationType.EXPLORE_STATISTICS) !== -1);
    } else if (this.isAnalysis) {
      this.activeItem = this.items.find((item) => item.label.indexOf(OperationType.ANALYSIS) !== -1);
    } else if (this.isResults) {
      this.activeItem = this.items.find((item) => item.label.indexOf(OperationType.RESULTS) !== -1);
    } else {
      if (this.isSurvivalRes) {
        this.activeItem = this.items.find((item) => item.label.indexOf(OperationType.RESULTS) !== -1);
        for (let j = 0; j < this.resultItems.length; j++) {
          if (this.resultItems[j].routerLink.toString() === routerLink) {
            this.activeResultItem = this.resultItems[j]
            this._selectedSurvivalId.next(j)
            break
          }
        }
      }
    }

    if (!this.isSelectProject && !this.appConfig.projectId) {
      this.navigateToSelectProjectTab();
    }
  }

  insertNewSurvResults() {
    this.resultItems.push({ label: `Survival Result ${this._lastSuccessfulSurvival + 1}`, routerLink: `/results/survival/${this._lastSuccessfulSurvival + 1}` })
    this._lastSuccessfulSurvival++;
  }

  deleteSrvResult() {
    let index = this.resultItems.indexOf(this.activeResultItem)
    this.resultItems = this.resultItems.filter(obj => obj !== this.activeResultItem)
    this._selectedSurvivalIDtoDelete.next(index)
    if (this.resultItems.length === 0) {
      this.activeResultItem = undefined
      this.router.navigateByUrl(`/results`)
    } else if (this.resultItems.length !== index) {
      this.activeResultItem = this.resultItems[index]
      this.router.navigateByUrl(this.activeResultItem.routerLink.toString())
    } else {
      this.activeResultItem = this.resultItems[index - 1]
      this.router.navigateByUrl(this.activeResultItem.routerLink.toString())
    }
  }

  navigateToSelectProjectTab() {
    this.router.navigateByUrl('/select-project');
  }

  navigateToExploreTab() {
    this.items = this.items.map((item) => ({ ...item, disabled: false }));
    this.router.navigateByUrl('/explore');
  }

  navigateToExploreStatisticsTab() {
    this.router.navigateByUrl('/explore-statistics');
  }

  navigateToNewResults() {
    this.router.navigateByUrl(`/results/survival/${this._lastSuccessfulSurvival}`)
  }

  get items(): MenuItem[] {
    return this._items;
  }

  set items(value: MenuItem[]) {
    this._items = value;
  }

  get activeItem(): MenuItem {
    return this._activeItem;
  }

  set activeItem(value: MenuItem) {
    this._activeItem = value;
  }

  get resultItems(): MenuItem[] {
    return this._resultItems;
  }

  set resultItems(value: MenuItem[]) {
    this._resultItems = value;
  }

  get activeResultItem(): MenuItem {
    return this._activeResultItem;
  }

  set activeResultItem(value: MenuItem) {
    this._activeResultItem = value;
  }

  get isSelectProject(): boolean {
    return this._isSelectProject;
  }

  set isSelectProject(value: boolean) {
    this._isSelectProject = value;
  }

  get isExplore(): boolean {
    return this._isExplore;
  }

  set isExplore(value: boolean) {
    this._isExplore = value;
  }

  get isExploreStatistics(): boolean {
    return this._isExploreStatistics;
  }

  set isExploreStatistics(value: boolean) {
    this._isExploreStatistics = value;
  }

  get isExploreResults(): boolean {
    return this._isExploreResults;
  }

  set isExploreResults(value: boolean) {
    this._isExploreResults = value;
  }

  get isAnalysis(): boolean {
    return this._isAnalysis
  }

  set isAnalysis(value: boolean) {
    this._isAnalysis = value
  }

  set isSurvivalRes(value: boolean) {
    this._isSurvivalRes = value
  }

  get isSurvivalRes(): boolean {
    return this._isSurvivalRes
  }

  get selectedSurvivalId(): Observable<number> {
    return this._selectedSurvivalId.asObservable()
  }

  get selectedSurvivalIDtoDelete(): Observable<number> {
    return this._selectedSurvivalIDtoDelete.asObservable();
  }

  get isResults(): boolean {
    return this._isResults;
  }

  set isResults(value: boolean) {
    this._isResults = value;
  }

}
