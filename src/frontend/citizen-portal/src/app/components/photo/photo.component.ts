import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import {
  AzureKeyCredential,
  FormPollerLike,
  FormRecognizerClient,
} from '@azure/ai-form-recognizer';
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

  public photoCaptureType = new FormControl('upload');

  public showWebcam = false;
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

  constructor(private http: HttpClient) {}

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

    // client.beginRecognizeCustomForms('123', imageSource, {
    //   onProgress: (state) => {
    //     console.log(`analyzing status: ${state.status}`);
    //   },
    // });

    const poller = client.beginRecognizeInvoices(imageSource, {
      onProgress: (state) => {
        console.log(`analyzing status: ${state.status}`);
      },
    });

    this.busy = poller;

    poller.then(this.onFulfilled(), this.onRejected);
  }

  private onFulfilled(): (poller: FormPollerLike) => void {
    return (poller: FormPollerLike) => {
      this.busy = poller.pollUntilDone().then(() => {
        console.log('result', poller.getResult());
        const invoices = poller.getResult();

        if (!invoices || invoices.length <= 0) {
          throw new Error('Expecting at least one invoice in analysis result');
        }

        const invoice = invoices[0];
        console.log('First invoice:', invoice);
        this.formInfo = invoice;
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
    console.log('toggleWebcam', $event);
    this.showWebcam = $event.value === 'take'; // $event.checked; //!this.showWebcam;
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
}
