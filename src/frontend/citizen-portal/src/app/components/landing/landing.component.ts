import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpRequest,
} from '@angular/common/http';
import { AfterViewInit, Component } from '@angular/core';
import {
  AzureKeyCredential,
  FormPollerLike,
  FormRecognizerClient,
} from '@azure/ai-form-recognizer';
import { ApiHttpResponse } from '@core/models/api-http-response.model';
import { ApiResource } from '@core/resources/api-resource.service';
import { SnowplowService } from '@core/services/snowplow.service';
import { UtilsService } from '@core/services/utils.service';
import { AppConfigService } from 'app/services/app-config.service';

// import * as fs from 'fs';
import fs from 'fs'; // Without star
import { catchError, map, tap } from 'rxjs/operators';
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements AfterViewInit {
  // Urls for the various links
  public understandYourTicketLink: string;
  public paymentOptionsLink: string;
  public resolutionOptionsLink: string;
  public roadSafetyBCVisitUsLink: string;
  public icbcVisitUsLink: string;
  public provincialCourtOfBCVisitUsLink: string;
  public courthouseServicesOfBCVisitUsLink: string;

  constructor(
    private utilsService: UtilsService,
    private appConfigService: AppConfigService,
    private snowplow: SnowplowService,
    private apiResource: ApiResource,
    private http: HttpClient
  ) {
    this.understandYourTicketLink =
      this.appConfigService.understandYourTicketLink;
    this.paymentOptionsLink = this.appConfigService.paymentOptionsLink;
    this.resolutionOptionsLink = this.appConfigService.resolutionOptionsLink;
    this.roadSafetyBCVisitUsLink =
      this.appConfigService.roadSafetyBCVisitUsLink;
    this.icbcVisitUsLink = this.appConfigService.icbcVisitUsLink;
    this.provincialCourtOfBCVisitUsLink =
      this.appConfigService.provincialCourtOfBCVisitUsLink;
    this.courthouseServicesOfBCVisitUsLink =
      this.appConfigService.courthouseServicesOfBCVisitUsLink;

    // works
    // this.recognizeContent();

    /*---------------------works
    const endpoint =
      'https://canadacentral.api.cognitive.microsoft.com/formrecognizer/v2.1-preview.3/prebuilt/invoice/analyze';
    const body =
      '{ "source": "https://4rfnv3jdfte8qj2229aqgj4h-wpengine.netdna-ssl.com/wp-content/uploads/2017/10/8797944_web1_171110-SNE-Emily-Carr_1-640x426.jpg" }';

    const headerDict = {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': '65440468b684497988679b8857f33a36',
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
      observe: 'response',
    };
    const headers = new HttpHeaders(headerDict);

    this.http
      .post<any>(endpoint, body, {
        headers: headers,
        observe: 'response' as 'body',
        responseType: 'json',
      })
      .subscribe((data) => {
        // console.log('post complete', data);

        const requestId = data.headers.get('apim-request-id');
        console.log('requestId', requestId);
        // this.recognizeContent();
        this.getBack(requestId);
      });
      --------------------------------------------
      */
  }

  private getBack(requestId): void {
    const reqId = 'a51cd39e-04bc-4a19-a228-24a958690367';
    const endpoint =
      'https://canadacentral.api.cognitive.microsoft.com/formrecognizer/v2.1-preview.3/prebuilt/invoice/analyzeResults/' +
      reqId;

    const headerDict = {
      'Ocp-Apim-Subscription-Key': '65440468b684497988679b8857f33a36',
    };
    const headers = new HttpHeaders(headerDict);

    this.http
      .get<any>(endpoint, {
        headers: headers,
      })
      .subscribe((data) => {
        console.log('get complete', data);
      });
  }

  private recognizeContent(): void {
    const endpoint = 'https://canadacentral.api.cognitive.microsoft.com';
    const apiKey = '65440468b684497988679b8857f33a36';

    const client = new FormRecognizerClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    const url =
      'https://4rfnv3jdfte8qj2229aqgj4h-wpengine.netdna-ssl.com/wp-content/uploads/2017/10/8797944_web1_171110-SNE-Emily-Carr_1-640x426.jpg';

    const poller = client.beginRecognizeInvoicesFromUrl(url, {
      onProgress: (state) => {
        console.log(`analyzing status: ${state.status}`);
      },
    });

    poller.then(this.onFulfilled, this.onRejected);

    //       poller.then(value => {
    //   // fulfillment
    // }, reason => {
    //   // rejection
    // });

    // .then(onfulfilled?: (value: FormPollerLike) => {
    //   console.log('value', value);
    // }, onrejected(reason: any) => {
    //   console.log('rejected');
    // })
    // .then((data: FormPollerLike) => {
    //   console.log('data: ' + JSON.stringify(data));
    //   data.pollUntilDone().then((temp: any) => {
    //     console.log('data2', temp);
    //   });

    // const pages = poller.pollUntilDone();
    // pages.then((data)=>{
    //   console.log("Promise resolved with: " + JSON.stringify(data));
    // }).catch((error)=>{
    //   console.log("Promise rejected with " + JSON.stringify(error));
    // });

    // if (!pages || pages.length === 0) {
    //   throw new Error('Expecting non-empty list of pages!');
    // }

    // for (const page of pages) {
    //   console.log(
    //     `Page ${page.pageNumber}: width ${page.width} and height ${page.height} with unit ${page.unit}`
    //   );
    //   for (const table of page.tables) {
    //     for (const cell of table.cells) {
    //       console.log(
    //         `cell [${cell.rowIndex},${cell.columnIndex}] has text ${cell.text}`
    //       );
    //     }
    //   }
    // }
    // })
    // .catch((error) => {
    //   // console.log('Promise rejected with ' + JSON.stringify(error));
    // })
    // .finally(() => {
    //   console.log('finally');
    // });
  }

  private onFulfilled(xx: FormPollerLike) {
    console.log('onFulfilled', xx);
    xx.pollUntilDone().then((temp: any) => {
      console.log('pollUntilDone', temp);
    });
  }

  private onRejected(xx) {
    console.log('onRejected', xx);
  }

  // private recognizeContent2(): void {
  //   const endpoint =
  //     'https://canadacentral.api.cognitive.microsoft.com/formrecognizer/v2.1-preview.3/prebuilt/invoice/analyze';
  //   const apiKey = '65440468b684497988679b8857f33a36';
  //   const fileName = './assets/violation_ticket_sample.jpg';

  //   if (!fs.existsSync(fileName)) {
  //     console.log(`Expected file "${fileName}" to exist.`);
  //     return;
  //   }

  //   const readStream = fs.createReadStream(fileName);

  //   const client = new FormRecognizerClient(
  //     endpoint,
  //     new AzureKeyCredential(apiKey)
  //   );

  //   const poller = client.beginRecognizeInvoices(readStream);
  //   poller
  //     .then((data) => {
  //       console.log('Promise resolved with: ' + JSON.stringify(data));
  //     })
  //     .catch((error) => {
  //       console.log('Promise rejected with ' + JSON.stringify(error));
  //     });

  //   // const poller = await client.beginRecognizeInvoices(readStream, {
  //   //   onProgress: (state) => {
  //   //     console.log(`status: ${state.status}`);
  //   //   }
  //   // });

  //   // const [invoice] = await poller.pollUntilDone();

  //   // if (invoice === undefined) {
  //   //   throw new Error("Failed to extract data from at least one invoice.");
  //   // }

  //   // /**
  //   //  * This is a helper function for printing a simple field with an elemental type.
  //   //  */
  //   // function fieldToString(field: FormField) {
  //   //   const { name, valueType, value, confidence } = field;
  //   //   return `${name} (${valueType}): '${value}' with confidence ${confidence}'`;
  //   // }

  //   // console.log("Invoice fields:");

  //   // /**
  //   //  * Invoices contain a lot of optional fields, but they are all of elemental types
  //   //  * such as strings, numbers, and dates, so we will just enumerate them all.
  //   //  */
  //   // for (const [name, field] of Object.entries(invoice.fields)) {
  //   //   if (field.valueType !== "array" && field.valueType !== "object") {
  //   //     console.log(`- ${name} ${fieldToString(field)}`);
  //   //   }
  //   // }

  //   // // Invoices also support nested line items, so we can iterate over them.
  //   // let idx = 0;

  //   // console.log("- Items:");

  //   // const items = invoice.fields["Items"]?.value as FormField[] | undefined;
  //   // for (const item of items ?? []) {
  //   //   const value = item.value as Record<string, FormField>;

  //   //   // Each item has several subfields that are nested within the item. We'll
  //   //   // map over this list of the subfields and filter out any fields that
  //   //   // weren't found. Not all fields will be returned every time, only those
  //   //   // that the service identified for the particular document in question.

  //   //   const subFields = [
  //   //     "Description",
  //   //     "Quantity",
  //   //     "Unit",
  //   //     "UnitPrice",
  //   //     "ProductCode",
  //   //     "Date",
  //   //     "Tax",
  //   //     "Amount"
  //   //   ]
  //   //     .map((fieldName) => value[fieldName])
  //   //     .filter((field) => field !== undefined);

  //   //   console.log(
  //   //     [
  //   //       `  - Item #${idx}`,
  //   //       // Now we will convert those fields into strings to display
  //   //       ...subFields.map((field) => `    - ${fieldToString(field)}`)
  //   //     ].join("\n")
  //   //   );
  //   // }
  // }

  public ngAfterViewInit(): void {
    // refresh link urls now that we set the links
    this.snowplow.refreshLinkClickTracking();
    this.utilsService.scrollTop();
  }
}
