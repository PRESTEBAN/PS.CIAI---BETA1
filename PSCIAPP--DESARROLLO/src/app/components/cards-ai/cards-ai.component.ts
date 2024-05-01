import { Component,Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-cards-ai',
  templateUrl: './cards-ai.component.html',
  styleUrls: ['./cards-ai.component.scss'],
})
export class CardsAIComponent  implements OnInit {

  @Input() backgroundImageUrl: string = '';
  @Input() cardTitle: string = '';
  @Input() cardContent: string = '';

  showDetails: boolean = false;

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  constructor() { }

  ngOnInit() {}

}
