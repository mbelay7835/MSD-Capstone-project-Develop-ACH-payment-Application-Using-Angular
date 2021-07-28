import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgxBraintreeModule } from 'ngx-braintree';

import { AppComponent } from './app.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { BoldPipe } from './textBoldPipe';

@NgModule({
  declarations: [
    AppComponent,
    CheckoutComponent,
    ConfirmationComponent,
    BoldPipe
  ],
  imports: [
    BrowserModule,
    NgxBraintreeModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forRoot([
      { path: '', component: CheckoutComponent },
      { path: 'confirmation', component: ConfirmationComponent }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
