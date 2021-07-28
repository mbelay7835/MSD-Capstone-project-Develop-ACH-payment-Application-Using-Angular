
import { Component, OnInit } from '@angular/core';
import * as braintree from 'braintree-web';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService } from '../payment.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  formValueString: any
  formValue: any;
  token: any;
  deviceData: any;
  confirmation: any;
  status: boolean = false;
  errorMessage: string = ""
  requiredFieldForPayment: string = ""
  requiredFieldForConfirmation: string = ""
  paymentForm: FormGroup
  confirmationForm: FormGroup

  constructor(private formBuilder: FormBuilder, private service: PaymentService, private router: Router) {

    this.formValueString = localStorage.getItem("paymentFormValue");
    this.formValue = localStorage.getItem("paymentFormValue") ? JSON.parse(this.formValueString) : {}
    console.log("formvalue", this.formValue)
    
    this.paymentForm = this.formBuilder.group({
      "firstName": [this.formValue.firstName || '', Validators.required],
      "lastName": [this.formValue.lastName || '', Validators.required],
      "routingNumber": [this.formValue.routingNumber || '', [Validators.required]],
      "accountNumber": [this.formValue.accountNumber || '', Validators.required],
      "accountType": [this.formValue.accountType || 'checking', Validators.required],
      "ownerType": [this.formValue.ownerType || 'personal', Validators.required],
      "streetAddress": [this.formValue.streetAddress || '', Validators.required],
      "buildingAddress": [this.formValue.buildingAddress || ''],
      "city": [this.formValue.city || '', Validators.required],
      "state": [this.formValue.state || '', Validators.required],
      "zipCode": [this.formValue.zipCode || '', Validators.required],
      "chargeAmount": [this.formValue.chargeAmount || '', Validators.required],
      "confirm": [this.formValue.confirm || false, Validators.required]
    })

    this.confirmationForm = this.formBuilder.group({
      "firstAmount": ['', Validators.required],
      "secondAmount": ['', Validators.required]
    })

    this.paymentForm.valueChanges.subscribe(
      (data: any) => console.log(data)
    );
  }


  //We need a token triggered when the component mount
  ngOnInit() {
    this.service.getToken().subscribe(response => {
      this.token = response.token
      localStorage.setItem("token", response.token)
    })
  }

  //When we logout the data in the localStorage will clear out.
  logout = () => {
    localStorage.clear();
    location.reload()
  }

  onPayment = () => {
   
    //Creating the client instance......................................................
    braintree.client.create({
      authorization: this.token
    }, (clientErr: any, clientInstance: any) => {
      if (clientErr) {
        throw clientErr;
      }

      //Creating the data collector instance............................................
      // braintree.dataCollector.create({
      //   client: clientInstance
      // }, (err: any, dataCollectorInstance: any) => {
      //   if (err) {
      //     return;
      //   }
      //   this.deviceData = dataCollectorInstance.deviceData;
      // });

      //Creating the usBackaccountInstance.............................................
      braintree.usBankAccount.create({
        client: clientInstance
      }, (usBankAccountErr: any, usBankAccountInstance: any) => {
        if (usBankAccountErr) {
          throw usBankAccountErr
        }

        if (!this.paymentForm.valid) {
          this.requiredFieldForPayment = "Please Enter Required field*"
          return
        }

        if (!this.paymentForm.value.confirm) {
          this.requiredFieldForPayment = "Please Authorize the payment"
          return
        }

        this.requiredFieldForPayment = ""

        const bankDetails: any = {
          accountNumber: this.paymentForm.value.accountNumber,
          routingNumber: this.paymentForm.value.routingNumber,
          accountType: this.paymentForm.value.accountType,
          ownershipType: this.paymentForm.value.ownerType,
          billingAddress: {
            streetAddress: this.paymentForm.value.streetAddress,
            extendedAddress: this.paymentForm.value.buildingAddress,
            locality: this.paymentForm.value.city,
            region: this.paymentForm.value.state,
            postalCode: this.paymentForm.value.zipCode
          }
        };

        if (bankDetails.ownershipType == "personal") {
          bankDetails.firstName = this.paymentForm.value.firstName;
          bankDetails.lastName = this.paymentForm.value.lastName;
        } else {
          bankDetails.businessName = "bussiness";
        }

        //Creating tokenized payload..........................................................
        usBankAccountInstance.tokenize({
          bankDetails: bankDetails,
          mandateText: this.paymentForm.value.confirm + ' I authorize Braintree to debit my bank account.'
        }, (tokenizeErr: any, tokenizedPayload: any) => {
          if (tokenizeErr) {
            alert("Authorization error")
            return
          }

          const payload = {
            chargeAmount: this.paymentForm.value.chargeAmount,
            nonce: tokenizedPayload,
            firstName: this.paymentForm.value.firstName,
            lastName: this.paymentForm.value.lastName
          }
          
          //Sending the payload to the backend.........................................
          this.service.addNonce(payload).subscribe(response => {
           
            if (response.status = "success" && !localStorage.getItem("verifiedValues")) {
              this.status = true;
              this.confirmation = "Please confirm the payment by entering the two numbers.";
            } else {
              this.confirmPayment()
            }
          })

        })
      });
    });
  }


  verifiedValue = () => {
    let confirmation;
    const verifiedString: any = localStorage.getItem("verifiedValues");

    if (verifiedString) {
      const verifiedObject = JSON.parse(verifiedString);
      //console.log(verifiedObject)
      let v1 = verifiedObject.firstAmount;
      let v2 = verifiedObject.secondAmount;
      confirmation = {
        "firstAmount": v1,//17,
        "secondAmount": v2//29
      }
    } else {
      //console.log("Triggered")
      confirmation = {
        "firstAmount": this.confirmationForm.value.firstAmount,//17,
        "secondAmount": this.confirmationForm.value.secondAmount//29
      }
    }
    return confirmation
  }



  confirmPayment = () => {
    
    this.service.confirmPayment(this.verifiedValue()).subscribe(response => {

      if (response.status == "success") {

        if (!localStorage.getItem("verifiedValues")) {
          const values = {
            firstAmount: this.confirmationForm.value.firstAmount,
            secondAmount: this.confirmationForm.value.secondAmount
          }
          localStorage.setItem("verifiedValues", JSON.stringify(values));
          this.router.navigate(['/', 'confirmation',], { state: { data: response.transaction } })
        }

        if (!localStorage.getItem("paymentFormValue")) {
          localStorage.setItem("paymentFormValue", JSON.stringify(this.paymentForm.value))
        }
        this.router.navigate(['/', 'confirmation',], { state: { data: response.transaction } })
      }

      this.errorMessage = "Not Authorized please try later."
    })
  }
}


