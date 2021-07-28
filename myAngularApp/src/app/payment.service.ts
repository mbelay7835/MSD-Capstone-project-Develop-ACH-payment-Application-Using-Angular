import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private http: HttpClient) { }
  
  getToken() {
    return this.http.get<any>(`http://localhost:3000/api/v1/token`)
  }

  addNonce(nonce:any) {
    return this.http.post<any>(`http://localhost:3000/api/v1/checkout`, nonce)
  }

  confirmPayment(confirmationId:any) {
    return this.http.post<any>(`http://localhost:3000/api/v1/confirmation`, confirmationId)
  }

  
}
