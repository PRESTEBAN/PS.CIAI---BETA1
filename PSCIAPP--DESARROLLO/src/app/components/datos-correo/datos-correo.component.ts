import { Component, OnInit } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';
import { UserService } from '../../services/user.service';
import { Observable, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-datos-correo',
  templateUrl: './datos-correo.component.html',
  styleUrls: ['./datos-correo.component.scss'],
})
export class DatosCorreoComponent implements OnInit {

  nombre: string = '';
  dia: number = 1;
  mes: number = 1;
  ano: number = 2004;
  genero: string = '';

  dias: number[] = [];
  meses: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  anos: number[] = Array.from({ length: 27 }, (_, i) => 2004 + i);

  loading: any;
  datos$: Observable<any[]> = of([]);
  datosSubscription: Subscription | undefined;

  horas: number[] = [];
  minutos: number[] = Array.from({ length: 60 }, (_, i) => i);

  constructor(
    private loadingController: LoadingController,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController,
    private firestore: AngularFirestore // Agrega AngularFirestore al constructor
  ) { }

  ngOnInit() {
    this.actualizarDias();
    this.actualizarHoras();
    this.verificarHora();
  }

  actualizarDias() {
    this.dias = [];
    const diasEnMes = new Date(this.ano, this.mes, 0).getDate(); 
    for (let i = 1; i <= diasEnMes; i++) {
      this.dias.push(i);
    }
  }



  async submitForm() {
    if (!this.nombre || !this.dia || !this.mes || !this.ano || !this.genero) {
      this.mostrarAlerta('Llena todos los campos');
      return;
    }

    this.loading = await this.loadingController.create({
      message: 'Cargando...',
      duration: 200,
    });
    await this.loading.present();


    const userId = this.userService.getUserId();
    if (userId) {
      try {
        const fechaNacimiento = new Date(this.ano, this.mes - 1, this.dia);
        const edad = this.calcularEdad(fechaNacimiento);
        console.log('Edad calculada:', edad); 
        await this.userService.saveFormDataCorreo(userId, this.nombre, `${this.dia}/${this.mes}/${this.ano}`, this.genero, edad);
        localStorage.setItem(`correoContraseñaNombre_${userId}`, this.nombre);
        await this.createCalendarForUser(userId);

        setTimeout(() => {
          this.loading.dismiss();
        }, 2000);

        this.router.navigate(['/principal2', { nombre: this.nombre }]);
      } catch (error) {
        console.error('Error al crear el calendario:', error);
        this.mostrarAlerta('Error al crear el calendario');
        this.loading.dismiss();
      }
    }
  }

  calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  async mostrarAlerta(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Alerta',
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alert.present();
  }  

  async createCalendarForUser(userId: string) {
    // Crea un objeto de datos para el calendario
    const calendarData = {//se agregan los dias a la base de datos
      userIDCal: userId,//se enlasa el user ID
      day1: '', day2: '', day3: '', day4: '', day5: '', day6: '',
      day7: '', day8: '', day9: '', day10: '', day11: '', day12: '',
      day13: '', day14: '', day15: '', day16: '', day17: '', day18: '',
      day19: '', day20: '', day21: '', day22: '', day23: '', day24: '',
      day25: '', day26: '', day27: '', day28: '', day29: '', day30: '',
      day31: ''
    };

    // Crea el calendario en la colección "Calendario"
    await this.firestore.collection('Calendario').add(calendarData);
    console.log('Calendario creado para el usuario con ID:', userId);
  }

  ngOnDestroy() {
    if (this.datosSubscription) {
      this.datosSubscription.unsubscribe();
    }
  }





// Inicializa la hora seleccionada
horaSeleccionada = {
  ampm: 'AM',
  hora: 12,
  minuto: 0
};


// Actualiza las horas basadas en AM o PM
actualizarHoras() {
  if (this.horaSeleccionada.ampm === 'AM') {
    this.horas = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i + 1));
  } else {
    this.horas = Array.from({ length: 12 }, (_, i) => i + 12);
  }
}

// Función para manejar la acción de guardar la hora
guardarHora() {
  console.log('Hora seleccionada:', this.horaSeleccionada);
  // Agregar aquí lógica adicional según sea necesario
}

async guardarHoras() {
  console.log('Hora seleccionada:', this.horaSeleccionada);
  const userId = this.userService.getUserId(); // Obtener el ID del usuario
  if (userId) {
    try {
      await this.firestore.collection('timenotification').doc(userId).set({
        hora: this.horaSeleccionada.hora,
        minuto: this.horaSeleccionada.minuto,
        ampm: this.horaSeleccionada.ampm
      });
      console.log('Hora guardada en Firebase.');
    } catch (error) {
      console.error('Error al guardar la hora en Firebase:', error);
    }
  }
}


async solicitarPermisosNotificacion() {
  try {
    // Solicitar permisos de notificación
    await LocalNotifications.requestPermissions();
    console.log('Permisos de notificación concedidos.');
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
  }
}

verificarHora() {
  setInterval(async () => {
    const userId = this.userService.getUserId(); // Obtener el ID del usuario
    if (userId) {
      const userDoc = await this.firestore.collection('timenotification').doc(userId).get().toPromise();
      if (userDoc && userDoc.exists) {
        const horaGuardada = userDoc.data() as any;
        const horaAMPM = horaGuardada.ampm;
        let hora = horaGuardada.hora;
        if (horaAMPM === 'PM' && hora < 12) {
          hora += 12; // Convertir a formato de 24 horas si es PM y no es medianoche
        } else if (horaAMPM === 'AM' && hora === 12) {
          hora = 0; // Convertir a formato de 24 horas si es medianoche
        }

        const horaActual = new Date();
        const horaActual24 = horaActual.getHours();
        const minutoActual = horaActual.getMinutes();

        if (hora === horaActual24 && horaGuardada.minuto === minutoActual) {
          const ultimaNotificacion = horaGuardada.ultimaNotificacion?.toDate();
          if (!ultimaNotificacion || horaActual.getTime() - ultimaNotificacion.getTime() >= 24 * 60 * 60 * 1000) {
            this.lanzarNotificacion();
            await this.firestore.collection('timenotification').doc(userId).update({
              ultimaNotificacion: new Date()
            });
          }
        }
      }
    }
  }, 1000); // Verificar cada minuto
}



async lanzarNotificacion() {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "¿Qué tal tu día, sigamos en nuestro camino con serenidad cada día ",
          body: "Recuerda que aquí estoy para hablar, no olvides dedicarte un tiempo para ti mismo hoy. Abre la app y encuentra un espacio de tranquilidad para encontrar equilibrio en tu día.😁",
          id: 1,
          schedule: { 
            at: new Date(Date.now() + 1000), // Puedes ajustar el tiempo de espera aquí
            allowWhileIdle: true // Permite que la notificación se ejecute incluso durante el modo reposo
          },
          sound: "beep.wav",
          smallIcon: "ic_stat_icon_config_sample",
          iconColor: "#488AFF"
        }
      ]
    });
    console.log('Notificación programada con éxito.');
  } catch (error) {
    console.error('Error al programar la notificación:', error);
  }
}
}