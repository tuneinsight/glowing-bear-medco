/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021  EPFL LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable} from '@angular/core';
import {AppConfig} from '../config/app.config';
import {Observable, from} from 'rxjs';
import {KeycloakService} from 'keycloak-angular';

@Injectable()
export class AuthenticationService {

  static readonly GECO_PATIENT_LIST_ROLE = 'patient_list';
  static readonly GECO_GLOBAL_COUNT_ROLE = 'global_count';
  static readonly GECO_GLOBAL_COUNT_OBFUSCATED_ROLE = 'global_count_obfuscated';
  static readonly GECO_SURVIVAL_QUERY_ROLE = 'survival_query';
  static readonly GECO_STATISTICS_QUERY_ROLE = 'statistics_query';
  static readonly GECO_STATISTICS_QUERY_OBFUSCATED_ROLE = 'statistics_query_obfuscated';

  constructor(private config: AppConfig,
              private keycloakService: KeycloakService) { }

  /**
   * Init the keycloak service with proper parameters.
   */
  public load() {
    return this.keycloakService.init({
      config: {
        url: this.config.getConfig('keycloak-url'),
        realm: this.config.getConfig('keycloak-realm'),
        clientId: this.config.getConfig('keycloak-client-id')
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false
      },
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
      bearerExcludedUrls: ['/assets', '/app'],
      loadUserProfileAtStartUp: true
    }).finally(() => {
      if (!this.hasMinimumRoles()) {
        console.error('Authentication or authorization failed. Roles: ', this.userRoles)
        alert('Authentication has failed or authorizations are insufficient. Please login with a different account or contact an administrator. You will now be logged out.')
        this.keycloakService.logout();
      }
    });
  }

  /**
   * Returns true if the user has the minimum set of roles needed for the basic operation of TI4Health.
   */
  public hasMinimumRoles(): boolean {
    return  (
              this.userRoles.includes(AuthenticationService.GECO_PATIENT_LIST_ROLE) ||
              this.userRoles.includes(AuthenticationService.GECO_GLOBAL_COUNT_ROLE) ||
              this.userRoles.includes(AuthenticationService.GECO_GLOBAL_COUNT_OBFUSCATED_ROLE)
            ) &&
            this.userRoles.includes(AuthenticationService.GECO_SURVIVAL_QUERY_ROLE) ||
            this.userRoles.includes(AuthenticationService.GECO_STATISTICS_QUERY_ROLE) ||
            this.userRoles.includes(AuthenticationService.GECO_STATISTICS_QUERY_OBFUSCATED_ROLE)
  }

  /**
   * Returns true if the user has the role for patient list.
   */
  public hasPatientListRole(): boolean {
    return this.userRoles.includes(AuthenticationService.GECO_PATIENT_LIST_ROLE);
  }

  /**
   * Returns true if the user has the role for global count.
   */
  public hasGlobalCountRole(): boolean {
    return this.userRoles.includes(AuthenticationService.GECO_GLOBAL_COUNT_ROLE);
  }

  /**
   * Returns true if the user has the role for global count obfuscated.
   */
  public hasGlobalCountObfuscatedRole(): boolean {
    return this.userRoles.includes(AuthenticationService.GECO_GLOBAL_COUNT_OBFUSCATED_ROLE);
  }

  /**
   * Returns true if the user has the role for survival query.
   */
  get hasSurvivalQueryRole(): boolean {
    return this.userRoles.includes(AuthenticationService.GECO_SURVIVAL_QUERY_ROLE);
  }

  /**
   * Returns true if the user has the role for statistics query.
   */
  public hasStatisticsQueryRole(): boolean {
    return this.userRoles.includes(AuthenticationService.GECO_STATISTICS_QUERY_ROLE);
  }

  /**
   * Returns true if the user has the role for statistics query.
   */
  public hasStatisticsQueryObfuscatedRole(): boolean {
    return this.userRoles.includes(AuthenticationService.GECO_STATISTICS_QUERY_OBFUSCATED_ROLE);
  }

  /**
   * Get user roles.
   */
  get userRoles(): string[] {
    return this.keycloakService.getUserRoles(true);
  }

  /**
   * Get username.
   */
  get username(): string {
    return this.keycloakService.getUsername();
  }

  /**
   * Get if user is logged in.
   */
  get userLoggedIn(): Observable<boolean> {
    return from(this.keycloakService.isLoggedIn());
  }

  /**
   * Initiate logout.
   */
   get logout(): Promise<void> {
    return this.keycloakService.logout();
  }
}
