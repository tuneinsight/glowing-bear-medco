import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ErrorHelper} from '../utilities/error-helper';
import {AppConfig} from '../config/app.config';

@Injectable()
export class ApiEndpointService {

  private readonly _endpointUrl: string;

  get endpointUrl(): string {
    return this._endpointUrl;
  }

  constructor(private http: HttpClient,
    private appConfig: AppConfig) {
    this._endpointUrl = this.appConfig.getConfig('medco-node-url');
  }

  /**
   * Make a post http request
   * @param urlPart - the part used in baseUrl/urlPart
   * @param body
   * @param apiUrl - use to override the api url configured
   * @returns {Observable<any | any>}
   */
  postCall(urlPart: string, body: object, apiUrl?: string): Observable<any> {
    const url = apiUrl ?
      apiUrl + '/' + urlPart :
      this.endpointUrl + '/' + urlPart;

    return this.http.post(url, body).pipe(
      catchError(ErrorHelper.handleHTTPError)
    );
  }

  /**
   * Make a get http request
   * @param urlPart - the part used in baseUrl/urlPart
   * @param additionalParam
   * @param apiUrl
   * @param noCatch
   * @returns {Observable<any | any>}
   */
  getCall(urlPart, additionalParam?, apiUrl?, isErrorCatched = true): Observable<any> {
    const url = apiUrl ? `${apiUrl}/${urlPart}` : `${this.endpointUrl}/${urlPart}`;
    if (isErrorCatched) {
      return this.http.get(url, additionalParam).pipe(
        catchError(ErrorHelper.handleHTTPError)
      );
    } else {
      return this.http.get(url, additionalParam);
    }
  }

  /**
   * Make a put http request
   * @param urlPart
   * @param body
   * @returns {Observable<any | any>}
   */
  putCall(urlPart, body) {
    let url = `${this.endpointUrl}/${urlPart}`;
    return this.http.put(url, body).pipe(
      catchError(ErrorHelper.handleHTTPError)
    );
  }

  /**
   * Make a patch http request
   * @param urlPart - the part used in baseUrl/urlPart
   * @param body
   * @param apiUrl - use to override the api url configured
   * @returns {Observable<any | any>}
   */
   patchCall(urlPart: string, body: object, apiUrl?: string): Observable<any> {
    const url = apiUrl ?
      apiUrl + '/' + urlPart :
      this.endpointUrl + '/' + urlPart;

    return this.http.patch(url, body).pipe(
      catchError(ErrorHelper.handleHTTPError)
    );
  }

  /**
   * Make a delete http request
   * @param urlPart
   * @param options
   * @param apiUrl
   * @returns {Observable<any | any>}
   */
  deleteCall(urlPart, apiUrl?) {
    const url = apiUrl ? `${apiUrl}/${urlPart}` : `${this.endpointUrl}/${urlPart}`;
    return this.http.delete(url).pipe(
      catchError(ErrorHelper.handleHTTPError)
    );
  }
}
