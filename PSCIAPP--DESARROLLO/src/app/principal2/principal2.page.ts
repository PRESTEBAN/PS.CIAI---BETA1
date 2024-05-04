import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from './../services/user.service';
import { Router } from '@angular/router';
import { AngularFirestore,AngularFirestoreCollection, QueryFn } from '@angular/fire/compat/firestore';
import { Subscription } from 'rxjs';
import { LoadingController, AlertController } from '@ionic/angular';
import firebase from 'firebase/compat/app'; 
import { ToastController } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import 'firebase/compat/database';


@Component({
  selector: 'app-principal2',
  templateUrl: './principal2.page.html',
  styleUrls: ['./principal2.page.scss'],
})
export class Principal2Page implements OnInit, OnDestroy {

  backgroundImageUrlAI: string = '';
  cardTitleAI: string = '';
  cardContentAI: string = '';
  mostrarComponenteAI: boolean = true;
 

  nombreUsuarioCorreo: string = '';
  currentCard: any;
  secondCard: any;
  sundaycard : any;
  userCardsSubscription: Subscription | undefined = undefined;
  timer: any = undefined; // Inicializar la propiedad timer
  isUpdatingCards: boolean = false; 
  contadorFeliz: number = 0;
  contadorNeutral: number = 0;
  contadorTriste: number = 0;
  estadoAnimo: string = ''; 

  motoresActivados: boolean = false;
  timeoutId: any;
  editable: boolean = false;
  loading: any;

  constructor(private route: ActivatedRoute, private userService: UserService, private router: Router, private firestore: AngularFirestore, private toastController: ToastController,  private loadingController: LoadingController, private alertController: AlertController) {
    this.actualizarHorasBola();
    this.editable = false;
   }

  ngOnInit() {
    const userId = this.userService.getUserId();
    if (!userId) {
      this.nombreUsuarioCorreo = 'Invitado'; // Si no se encuentra el ID de usuario, establece el nombre como 'Invitado'
      return;
    }
    

    this.userService.getUserNameFromDatabase(userId).then(name => {
      this.nombreUsuarioCorreo = name;
      this.loadUserCards(userId);
      this.checkUserCardsUpdate(userId);
      this.activarSoloDomingo();
    });

    // Suscribirse a los cambios en la colección 'user_cards'
    this.userCardsSubscription = this.firestore.collection('user_cards').doc(userId).valueChanges().subscribe((userData: any) => {
      this.currentCard = userData.currentCard;
      this.secondCard = userData.secondCard;

      
      if (!userData.currentCard || !userData.secondCard) {
        this.loadRandomCard(userId);
        this.loadSecondCard(userId);
      }
    });
    this.verificarHorasBola();
    this.actualizarHorasBola();
    this.editable = false;
  }

  

  horaSeleccionada = {
    ampm: 'AM',
    hora: 12,
    minuto: 0
  };
  

  horas: number[] = [];
  minutos: number[] = Array.from({ length: 60 }, (_, i) => i);
  horaMostrada = '';

  

  actualizarHorasBola() {
    if (this.horaSeleccionada.ampm === 'AM') {
      this.horas = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i + 1));
    } else {
      this.horas = Array.from({ length: 12 }, (_, i) => i + 12);
    }
  }
  async toggleMotores() {
    this.motoresActivados = !this.motoresActivados;
  
    const motorRef = firebase.database().ref('Dispositivos/Motor');
    const motor2Ref = firebase.database().ref('Dispositivos/Motor2');
  
    if (this.motoresActivados) {
      // Encender los motores
      motorRef.set(true);
      motor2Ref.set(true);
  
      // Apagar los motores después de 5 minutos
      this.timeoutId = setTimeout(() => {
        motorRef.set(false);
        motor2Ref.set(false);
        this.motoresActivados = false;
      }, 5 * 60 * 1000); // 5 minutos en milisegundos
    } else {
      // Si el botón se desactiva antes de que pasen los 5 minutos,
      // detenemos la cuenta regresiva para apagar los motores.
      clearTimeout(this.timeoutId);
      motorRef.set(false);
      motor2Ref.set(false);
    }
  }

  async guardarHorasBola() {
    console.log('Hora seleccionada:', this.horaSeleccionada);
    const userId = this.userService.getUserId(); // Obtener el ID del usuario
    if (userId) {
      try {
        await this.firestore.collection('timeaparate').doc(userId).set({
          hora: this.horaSeleccionada.hora,
          minuto: this.horaSeleccionada.minuto,
          ampm: this.horaSeleccionada.ampm
        });
        this.loading = await this.loadingController.create({
          message: 'Guardando...',
          duration: 400,
        });
        await this.loading.present();
        console.log('Hora guardada en Firebase.');
      } catch (error) {
        console.error('Error al guardar la hora en Firebase:', error);
      } finally {
        // Establecer editable en false independientemente del resultado del guardado
        this.editable = false;
      }
    }
  }

  verificarHorasBola() {
    setInterval(async () => {
      const userId = this.userService.getUserId(); // Obtener el ID del usuario
      if (userId) {
        const userDoc = await this.firestore.collection('timeaparate').doc(userId).get().toPromise();
        if (userDoc && userDoc.exists) {
          const horaGuardada = userDoc.data() as any;
          const horaAMPM = horaGuardada.ampm;
          let hora = horaGuardada.hora;

          const horaActual = new Date();
          const horaActual24 = horaActual.getHours();
          const minutoActual = horaActual.getMinutes();
          
          if (horaAMPM === 'PM' && hora < 12) {
            hora += 12; // Convertir a formato de 24 horas si es PM y no es medianoche
          } else if (horaAMPM === 'AM' && hora === 12) {
            hora = 0; // Convertir a formato de 24 horas si es medianoche
          }
  
  
          if (hora === horaActual24 && horaGuardada.minuto === minutoActual) {
            const ultimaNotificacion = horaGuardada.ultimaNotificacion?.toDate();
            if (!ultimaNotificacion || horaActual.getTime() - ultimaNotificacion.getTime() >= 24 * 60 * 60 * 1000) {
              this.lanzarNotificacionBola();
              await this.firestore.collection('timeaparate').doc(userId).update({
                ultimaNotificacion: new Date()
              });
            }

            const motorRef = firebase.database().ref('Dispositivos/Motor');
            motorRef.set(true); // Encender el motor
          
            const motor2Ref = firebase.database().ref('Dispositivos/Motor2');
            motor2Ref.set(true); // Encender el segundo motor
          
            setTimeout(() => {
              motorRef.set(false); // Apagar el motor después de 5 minutos
              motor2Ref.set(false); // Apagar el segundo motor después de 5 minutos
            }, 5 * 60 * 1000); // 5 minutos en milisegundos
          }
        }
      }
    }, 1000); // Verificar cada minuto
  }

  

  loadSundayCard() {
    let cardList: string[] = [];
  
    switch (this.estadoAnimo) {
      case 'feliz':
        cardList = ['card10', 'card14', 'card22', 'card5', 'card7', 'card8', 'card20', 'card26', 'card6'];
        break;
      case 'neutral':
        cardList = ['card1', 'card11', 'card12', 'card16', 'card18', 'card19', 'card24', 'card26', 'card6'];
        break;
      case 'triste':
        cardList = ['card2', 'card3', 'card4', 'card9', 'card13', 'card15', 'card17', 'card21', 'card23', 'card25', 'card27'];
        break;
      default:
        console.error('Estado de ánimo no reconocido');
        return;
    }
  
    const randomCardId = cardList[Math.floor(Math.random() * cardList.length)];
  
    this.firestore.collection('cards').doc(randomCardId).get().subscribe(doc => {
      if (doc.exists) {
        const data = doc.data() as any;
        // Asignar los datos de la tarjeta a sundaycard
        this.sundaycard = {
          titulo: data.titulo,
          contenido: data.contenido,
          imagen: data.imagen
        };
      } else {
        console.error('La tarjeta seleccionada no existe en la base de datos.');
      }
    }, error => {
      console.error('Error al cargar la tarjeta:', error);
    });
  }


  loadUserCards(userId: string) {
    const userCardsRef = this.firestore.collection('user_cards').doc(userId);

    userCardsRef.get().subscribe(snapshot => {
      if (!snapshot.exists) {
        // Si el documento no existe, crearlo con valores predeterminados
        userCardsRef.set({ currentCard: null, secondCard: null }).then(() => {
          console.log('User cards document created');
        }).catch(error => {
          console.error('Error creating user cards document:', error);
        });
      }
    }, error => {
      console.error('Error loading user cards:', error);
    });
  }

  loadRandomCard(userId: string) {
    // Obtener una card aleatoria de la colección 'cards' de Firestore
    this.firestore.collection('cards').get().subscribe(querySnapshot => {
      const cards: { id: string, titulo: string, contenido: string, imagen: string }[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as {
          titulo: string,
          contenido: string,
          imagen: string
        };
        cards.push({
          id: doc.id,
          titulo: data.titulo,
          contenido: data.contenido,
          imagen: data.imagen
        });
      });
      // Obtener un índice aleatorio
      const randomIndex = Math.floor(Math.random() * cards.length);
      this.currentCard = cards[randomIndex];
      this.updateUserCard(userId, 'currentCard', this.currentCard);
    }, error => {
      console.error('Error al cargar la tarjeta aleatoria:', error);
    });
  }

  loadSecondCard(userId: string) {
    // Obtener una segunda tarjeta aleatoria de la colección 'cards' de Firestore
    this.firestore.collection('cards').get().subscribe(querySnapshot => {
      const cards: { id: string, titulo: string, contenido: string, imagen: string }[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as {
          titulo: string,
          contenido: string,
          imagen: string
        };
        cards.push({
          id: doc.id,
          titulo: data.titulo,
          contenido: data.contenido,
          imagen: data.imagen
        });
      });

      // Filtrar la segunda tarjeta para asegurarse de que sea diferente a la primera
      const filteredCards = cards.filter(card => card.id !== this.currentCard.id);

      // Obtener un índice aleatorio
      const randomIndex = Math.floor(Math.random() * filteredCards.length);
      this.secondCard = filteredCards[randomIndex];
      this.updateUserCard(userId, 'secondCard', this.secondCard);
    }, error => {
      console.error('Error al cargar la segunda tarjeta aleatoria:', error);
    });
  }

  updateUserCard(userId: string, cardType: string, cardData: any) {
    this.firestore.collection('user_cards').doc(userId).update({
      [cardType]: cardData
    }).then(() => {
      console.log(`Tarjeta ${cardType} actualizada para el usuario ${userId}`);
    }).catch(error => {
      console.error(`Error al actualizar la tarjeta ${cardType} para el usuario ${userId}:`, error);
    });
  }

  checkUserCardsUpdate(userId: string) {
    const currentDate = new Date();
    
    // Obtener la fecha de última actualización de las tarjetas del usuario desde Firestore
    this.firestore.collection('last_card_update').doc(userId).get().subscribe(doc => {
        if (doc.exists) {
            const data = doc.data() as { lastUpdateDate: firebase.firestore.Timestamp }; // Especificar el tipo de dato esperado
            const lastUpdateDate = data.lastUpdateDate.toDate(); // Convertir la marca de tiempo a objeto de fecha
            
            // Verificar si es un nuevo día y si es la primera vez que el usuario inicia sesión
            if (currentDate.getDate() !== lastUpdateDate.getDate() || !data.lastUpdateDate) {
                console.log('Updating cards for user:', userId);
                this.isUpdatingCards = true; // Marcar que la actualización está en curso
                this.loadRandomCard(userId);
                this.loadSecondCard(userId);
                
                // Actualizar la fecha de última actualización en Firestore
                this.updateLastUpdateDate(userId, currentDate);
            }
        } else {
            // Si no existe un documento para el usuario, crear uno y actualizar la fecha de última actualización
            this.updateLastUpdateDate(userId, currentDate);
        }
    });
}


  updateLastUpdateDate(userId: string, currentDate: Date) {
    // Actualizar la fecha de última actualización en Firestore
    this.firestore.collection('last_card_update').doc(userId).set({
        lastUpdateDate: firebase.firestore.Timestamp.fromDate(currentDate) // Convertir la fecha actual a marca de tiempo de Firestore
    }).then(() => {
        console.log('Last update date updated for user:', userId);
    }).catch(error => {
        console.error('Error updating last update date:', error);
    });
  }


  ngOnDestroy() {
    // Limpia el temporizador al destruir el componente para evitar fugas de memoria
    if (this.timer) {
      clearInterval(this.timer);
    }
    // Cancela la suscripción a los cambios en Firestore
    if (this.userCardsSubscription) {
      this.userCardsSubscription.unsubscribe();
    }
  }

  activarSoloDomingo() {
    const today = new Date();
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0) {
      this.contadorFeliz = 0;
      this.contadorNeutral = 0;
      this.contadorTriste = 0;

      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(firstDayOfWeek);
        currentDate.setDate(firstDayOfWeek.getDate() + i);

        const field = `day${currentDate.getDate()}`;

        const userId = this.userService.getUserId();
        if (userId) {
          const docRef = this.firestore.collection('Calendario').doc(userId);
          docRef.get().subscribe(docSnapshot => {
            if (docSnapshot.exists) {
              const data = docSnapshot.data() as any;
              if (data && data[field]) {
                switch (data[field]) {
                  case 'feliz':
                    this.contadorFeliz++;
                    break;
                  case 'neutral':
                    this.contadorNeutral++;
                    break;
                  case 'triste':
                    this.contadorTriste++;
                    break;
                }
              }
            }
          }, error => {
            console.error('Error al obtener el documento del calendario:', error);
          });
        }
      }
    
        if (this.contadorFeliz > this.contadorNeutral && this.contadorFeliz > this.contadorTriste) {
          this.loadSundayCard();
        } else if (this.contadorTriste > this.contadorFeliz && this.contadorTriste > this.contadorNeutral) {
          this.loadSundayCard();
        } else {
          this.loadSundayCard();
        }
        this.mostrarComponenteAI = true;
      } else {
        this.mostrarComponenteAI = false;
        console.log('Hoy no es domingo.');
      }
    }


  seleccionarEstadoAnimo(estado: string) {
    this.estadoAnimo = estado;
  }


  async guardarRespuesta(sentimiento: string) {
    const userId = this.userService.getUserId();
    if (userId) {
      const date = new Date();
      const day = date.getDate();
      const field = `day${day}`;
  
      try {
        // Obtener la colección 'Calendario' filtrando por userIDCal igual al userId actual
        const collectionRef: AngularFirestoreCollection<any> = this.firestore.collection<any>('Calendario', ref => ref.where('userIDCal', '==', userId));
        const querySnapshot = await collectionRef.get().toPromise();
        
        if (querySnapshot && !querySnapshot.empty) {
          // Obtener el primer documento que cumple con el filtro (debería haber solo uno)
          const doc = querySnapshot.docs[0];
          // Actualizar el campo correspondiente al día en el calendario del usuario
          await doc.ref.update({ [field]: sentimiento });
          console.log('Respuesta actualizada con éxito en el calendario del usuario.');
        } else {
          console.error('El documento del calendario no existe para este usuario.');
        }
      } catch (error) {
        console.error('Error al guardar la respuesta:', error);
      }
    } else {
      console.error('No se pudo obtener el ID de usuario.');
    }
  }
  
  async guardarEstadoAnimo() {
    await this.guardarRespuesta(this.estadoAnimo);
    this.mostrarNotificacion(`Estado de ánimo actualizado: ${this.estadoAnimo}`);
  }

  async mostrarNotificacion(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  irChat() {
    this.router.navigate(['/chat']);
  }

  irPrincipal() {
    this.router.navigate(['/Principal2']);
  }

  irAccount(){
    this.router.navigate(['/account']);
  }

logout() {
  const userId = this.userService.getUserId();

  if (userId !== undefined) {
    // Limpiar los mensajes al cerrar sesión
    const userMessagesRef = this.userService.getUserMessagesRef(userId);

    if (userMessagesRef) {
      userMessagesRef.get().subscribe(snapshot => {
        snapshot.forEach(doc => {
          doc.ref.delete();
        });
      });
    } else {
      console.error('User Messages Reference is null');
    }
  }

  // Desuscribirse de los cambios en Firestore
  if (this.userCardsSubscription) {
    this.userCardsSubscription.unsubscribe();
  }

  // Limpiar el temporizador
  if (this.timer) {
    clearInterval(this.timer);
  }

  this.userService.logout().then(() => {
    this.router.navigate(['/home']);
  }).catch((error) => {
    console.error('Error al cerrar sesión:', error);
  });
}

async lanzarNotificacionBola() {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Hora de relajarse!",
          body: "¡Hora de relajarse!, es tiempo de usar tu ",
          id: 2,
          schedule: { 
            at: new Date(Date.now() + 1000), // Puedes ajustar el tiempo de espera aquí
            allowWhileIdle: true // Permite que la notificación se ejecute incluso durante el modo reposo
          },
          sound: "beep.wav",
          actionTypeId: "",
          extra: {
            showWhenSuspended: true, // Muestra la notificación incluso cuando el dispositivo esté en suspensión
            vibrate: true, // Activa la vibración cuando se muestre la notificación
            priority: 2, // Prioridad de la notificación, 2 es alta prioridad
            importance: 2 // Importancia de la notificación, 2 es alta importancia
          }
        }
      ]
    });
    console.log('Notificación programada con éxito.');
  } catch (error) {
    console.error('Error al programar la notificación:', error);
  }
}
}
