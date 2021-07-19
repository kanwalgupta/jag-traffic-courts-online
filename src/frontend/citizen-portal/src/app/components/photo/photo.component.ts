import { formatCurrency } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import {
  AzureKeyCredential,
  FormPollerLike,
  FormRecognizerClient,
} from '@azure/ai-form-recognizer';
import { AppRoutes } from 'app/app.routes';
import { DisputeService } from 'app/services/dispute.service';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Observable, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
})
export class PhotoComponent implements OnInit {
  // public busy: Subscription;
  public busy: Promise<any>;
  public formInfo: any;

  public processImageFromCam = true;

  public photoCaptureType = new FormControl('upload');

  public showWebcam = true; //false;
  // public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public videoOptions: MediaTrackConstraints = {
    // width: { min: 1280, ideal: 1920 },
    // height: { min: 720, ideal: 1080 },
  };
  public errors: WebcamInitError[] = [];

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();

  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<
    boolean | string
  >();

  public imageSrc: string;
  public myForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required]),
  });

  @Input()
  requiredFileType: string;

  public fileName = '';
  public uploadProgress: number;
  public uploadSub: Subscription;

  constructor(
    private disputeService: DisputeService,
    protected router: Router
  ) {}

  ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs().then(
      (mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      }
    );
  }

  public onFileChange(event: any) {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      console.log('You must select an image');
      return;
    }

    const mimeType = event.target.files[0].type;

    if (mimeType.match(/image\/*/) == null) {
      console.log('Only images are supported');
      return;
    }

    const reader = new FileReader();
    const file: File = event.target.files[0];
    console.log('file target', event.target.files[0]);
    this.fileName = file.name;
    reader.readAsDataURL(file);
    console.log('file', file.name, file.lastModified);

    reader.onload = () => {
      this.imageSrc = reader.result as string;

      this.formInfo = null;
      this.processImageFromCam = false;
      this.recognizeContent(file);

      this.myForm.patchValue({
        fileSource: reader.result,
      });
    };
  }

  private recognizeContent(imageSource: File): void {
    const endpoint = 'https://canadacentral.api.cognitive.microsoft.com';
    const apiKey = '65440468b684497988679b8857f33a36';

    const client = new FormRecognizerClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    const poller = client.beginRecognizeCustomForms(
      '8b16e3eb-b797-4e1c-a2f6-5891105222dc',
      imageSource,
      {
        onProgress: (state) => {
          console.log(`analyzing status: ${state.status}`);
        },
      }
    );

    // const poller = client.beginRecognizeInvoices(imageSource, {
    //   onProgress: (state) => {
    //     console.log(`analyzing status: ${state.status}`);
    //   },
    // });

    this.busy = poller;

    poller.then(this.onFulfilled(), this.onRejected);
  }

  private onFulfilled(): (poller: FormPollerLike) => void {
    return (poller: FormPollerLike) => {
      this.busy = poller.pollUntilDone().then(() => {
        // console.log('result', poller.getResult());
        const invoices = poller.getResult();

        if (!invoices || invoices.length <= 0) {
          throw new Error('Expecting at least one invoice in analysis result');
        }

        const invoice = invoices[0];
        console.log('First invoice:', invoice);
        // this.formInfo = invoice;

        const invoiceIdField = invoice.fields['violation ticket number'];
        if (invoiceIdField.valueType === 'string') {
          console.log(
            `  violation ticket number: '${
              invoiceIdField.value || '<missing>'
            }', with confidence of ${invoiceIdField.confidence}`
          );
        }
        const surnameField = invoice.fields['surname'];
        if (surnameField.valueType === 'string') {
          console.log(
            `  surname: '${
              surnameField.valueData?.text || '<missing>'
            }', with confidence of ${surnameField.confidence}`
          );
        }
        const givenNameField = invoice.fields['given name'];
        if (givenNameField.valueType === 'string') {
          console.log(
            `  given name: '${
              givenNameField.valueData?.text || '<missing>'
            }', with confidence of ${givenNameField.confidence}`
          );
        }
        const count1DescField = invoice.fields['count 1 description'];
        if (count1DescField.valueType === 'string') {
          console.log(
            `  count 1 description: '${
              count1DescField.valueData?.text || '<missing>'
            }', with confidence of ${count1DescField.confidence}`
          );
        }
        const count1SectionField = invoice.fields['count 1 section'];
        if (count1SectionField.valueType === 'string') {
          console.log(
            `  count 1 section: '${
              count1SectionField.valueData?.text || '<missing>'
            }', with confidence of ${count1SectionField.confidence}`
          );
        }
        const count1TicketAmountField = invoice.fields['count 1 ticket amount'];
        if (count1TicketAmountField.valueType === 'number') {
          console.log(
            `  count 1 ticket amount: '${
              count1TicketAmountField.value || '<missing>'
            }', with confidence of ${count1TicketAmountField.confidence}`
          );
        }
        const count2DescField = invoice.fields['count 2 description'];
        if (count2DescField.valueType === 'string') {
          console.log(
            `  count 2 description: '${
              count2DescField.valueData?.text || '<missing>'
            }', with confidence of ${count2DescField.confidence}`
          );
        }
        const count2SectionField = invoice.fields['count 2 section'];
        if (count2SectionField.valueType === 'string') {
          console.log(
            `  count 2 section: '${
              count2SectionField.valueData?.text || '<missing>'
            }', with confidence of ${count2SectionField.confidence}`
          );
        }
        const count2TicketAmountField = invoice.fields['count 2 ticket amount'];
        if (count2TicketAmountField.valueType === 'number') {
          console.log(
            `  count 2 ticket amount: '${
              count2TicketAmountField.value || '<missing>'
            }', with confidence of ${count2TicketAmountField.confidence}`
          );
        }
        const count3DescField = invoice.fields['count 3 description'];
        if (count3DescField.valueType === 'string') {
          console.log(
            `  count 3 description: '${
              count3DescField.valueData?.text || '<missing>'
            }', with confidence of ${count3DescField.confidence}`
          );
        }
        const count3SectionField = invoice.fields['count 3 section'];
        if (count3SectionField.valueType === 'string') {
          console.log(
            `  count 3 section: '${
              count3SectionField.valueData?.text || '<missing>'
            }', with confidence of ${count3SectionField.confidence}`
          );
        }
        const count3TicketAmountField = invoice.fields['count 3 ticket amount'];
        if (count3TicketAmountField.valueType === 'number') {
          console.log(
            `  count 3 ticket amount: '${
              count3TicketAmountField.value || '<missing>'
            }', with confidence of ${count3TicketAmountField.confidence}`
          );
        }

        this.formInfo = [
          {
            label: 'Ticket Number',
            data: invoiceIdField.value,
          },
          { label: 'Surname', data: surnameField.valueData?.text },
          { label: 'Given Name', data: givenNameField.valueData?.text },
          {
            label: 'Count 1 Description',
            data: count1DescField.valueData?.text,
          },
          {
            label: 'Count 1 Section',
            data: count1SectionField.valueData?.text?.replace(/\s/g, ''),
          },
          {
            label: 'Count 1 Ticket Amount',
            data: count1TicketAmountField.value
              ? formatCurrency(
                  Number(count1TicketAmountField.value),
                  'en-US',
                  '$'
                )
              : '',
          },
          {
            label: 'Count 2 Description',
            data: count2DescField.valueData?.text,
          },
          {
            label: 'Count 2 Section',
            data: count2SectionField.valueData?.text?.replace(/\s/g, ''),
          },
          {
            label: 'Count 2 Ticket Amount',
            data: count2TicketAmountField.value
              ? formatCurrency(
                  Number(count2TicketAmountField.value),
                  'en-US',
                  '$'
                )
              : '',
          },
          {
            label: 'Count 3 Description',
            data: count3DescField.valueData?.text,
          },
          {
            label: 'Count 3 Section',
            data: count3SectionField.valueData?.text?.replace(/\s/g, ''),
          },
          {
            label: 'Count 3 Ticket Amount',
            data: count3TicketAmountField.value
              ? formatCurrency(
                  Number(count3TicketAmountField.value),
                  'en-US',
                  '$'
                )
              : '',
          },
        ];
      });
    };
  }

  private onRejected(info) {
    console.log('onRejected', info);
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam($event: MatButtonToggleChange): void {
    // console.log('toggleWebcam', $event);
    // this.showWebcam = $event.value === 'take'; // $event.checked; //!this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    if (
      error.mediaStreamError &&
      error.mediaStreamError.name === 'NotAllowedError'
    ) {
      console.warn('Camera access was not allowed by user!');
    }
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.log('received webcam image', webcamImage);
    this.webcamImage = webcamImage;

    const arr = this.webcamImage.imageAsDataUrl.split(',');
    // const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file: File = new File([u8arr], 'invoice', { type: 'image/jpeg' });

    this.formInfo = null;
    this.processImageFromCam = true;
    this.recognizeContent(file);
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  public onCancel(): void {
    const ticket = this.disputeService.ticket;
    const params = {
      ticketNumber: ticket.violationTicketNumber,
      time: ticket.violationTime,
    };

    this.router.navigate([AppRoutes.disputePath(AppRoutes.SUMMARY)], {
      queryParams: params,
    });
  }
}
