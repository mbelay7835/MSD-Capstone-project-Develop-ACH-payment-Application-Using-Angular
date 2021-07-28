import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {


  confirmationData: any;

  constructor(private router: Router) {
    this.confirmationData = this.router.getCurrentNavigation()?.extras.state
  }

  ngOnInit() {
  }
}
