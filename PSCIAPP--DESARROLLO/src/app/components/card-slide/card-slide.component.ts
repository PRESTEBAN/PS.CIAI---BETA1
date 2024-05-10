import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-card-slide',
  templateUrl: './card-slide.component.html',
  styleUrls: ['./card-slide.component.scss'],
})
export class CardSlideComponent implements OnInit {

  showTerms: boolean = true;

  constructor(public alertController: AlertController) { }

  ngOnInit() {}

  hideTerms() {
    this.showTerms = false;
    console.log(this.showTerms)
  }

  async accept() {
    const alert = await this.alertController.create({
      header: 'Aceptar',
      message: '¡Has aceptado!',
      buttons: ['OK']
    });

    await alert.present();
  }
}