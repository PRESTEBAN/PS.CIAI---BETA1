import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {
  formReg: FormGroup;
  loading: any;
  constructor(
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.formReg = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
  }

  async onSubmit() {
    this.loading = await this.loadingController.create({
      message: 'Cargando...',
      duration: 2000,
    });
    await this.loading.present();
    if (this.formReg.valid) {
      try {
        await this.userService.register(this.formReg.value);
        this.router.navigate(['/cards-personalidadcorreo']);
      } catch (error) {
        this.presentAlert('Error', 'Correo o contraseña incorrectos.');
      }
    } else {
      this.presentAlert('Error', 'Por favor, completa todos los campos correctamente.');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
