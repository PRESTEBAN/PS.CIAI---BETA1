import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Message } from '../models/message.model';
import { OpenaiService } from '../services/openai.service';
import { UserService } from '../services/user.service';
import { IonContent,AlertController } from '@ionic/angular';
import { CustomValidators } from '../utils/custom-validators';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {

  @ViewChild(IonContent, { static: false }) content!: IonContent;

  messages: Message[] = [];


  form = new FormGroup({
    promt: new FormControl('', [Validators.required, CustomValidators.noWhiteSpace])
  })

  selectedCardImageUrl: string = '';
  loading: boolean = false;
  messagesLimit: number = 0;
  lastZeroMessageTimestamp: firebase.firestore.Timestamp | null = null;


  constructor(
    private openAi: OpenaiService,
    private userService: UserService,
    private router: Router,
    private firestore: AngularFirestore,
    private alertController: AlertController
  ) { }

  async ngOnInit() {

    try {
      const userId = await this.userService.getUserId();
  
      if (userId !== undefined) {
        const userMessagesRef = this.userService.getUserMessagesRef(userId);
        this.subscribeToMessagesLimit(userId);
        // Suscripción a cambios en el valor del límite de mensajes
        this.firestore.collection('users').doc(userId).valueChanges().subscribe((userData: any) => {
          if (userData && userData.messagesLimit !== undefined) { 
            this.messagesLimit = userData.messagesLimit;
            if (this.messagesLimit === 0) {
              this.createZeroMessageTimestamp(userId);
            }
          }
        });

        if (userMessagesRef) {
          // Verifica si ya hay mensajes en la colección
          userMessagesRef.ref.orderBy('timestamp').get().then(snapshot => {
            this.messages = []; // Limpia el array antes de agregar los nuevos mensajes
            snapshot.forEach(doc => {
              const message = doc.data() as Message;
              if (message.sender === 'user') {
                message.imageUrl = 'https://imgfz.com/i/dqtw7Qy.png'; // Aquí establece la URL de la imagen del usuario
              }
              this.messages.push(message);
            });
            // Actualiza los mensajes y habilita el formulario después de cargarlos
            this.scrollToBottom();
            this.form.enable();
          });
        } else {
          console.error('User Messages Reference is null');
        }

        // Consulta el valor de 'choice' en la colección 'Images'
        this.firestore.collection('users').doc(userId).get().subscribe(doc => {
          if (doc.exists) {
            const data = doc.data() as { choice?: number }; 
            console.log('URL de la imagen seleccionada:', this.getBotImageUrl(data.choice || 0)); // Agrega esta línea
            if (data && typeof data.choice === 'number') { // Comprueba si data.choice es un número
              // Establece la URL de la imagen del bot según la elección del usuario
              this.selectedCardImageUrl = this.getBotImageUrl(data.choice);
            } else {
              console.error('No se encontró el campo "choice" en el documento de Images o no es un número.');
            }
          } else {
            console.error('El documento de Images no existe.');
          }
        }, error => {
          console.error('Error al obtener el valor de choice desde la colección Images: ' + error);
        });

        
      } else {
        console.error('User ID is undefined');
      }
    } catch (error) {
      console.error('Error during user messages reference creation:', error);
    }
  }

  async checkAndResetMessageLimit(userId: string) {
    try {
      const userDocRef = this.firestore.collection('users').doc(userId);
      const userDocSnap = await userDocRef.get().toPromise();
      if (userDocSnap && userDocSnap.exists) {
        const userData = userDocSnap.data() as { messagesLimit?: number, lastZeroMessageTimestamp?: firebase.firestore.Timestamp };
        const currentLimit = userData?.messagesLimit || 0;
        if (currentLimit === 0) {
          // Obtiene la marca de tiempo actual
          const currentTimestamp = firebase.firestore.Timestamp.now();
          // Actualiza el timestamp a la hora actual
          await userDocRef.update({ lastZeroMessageTimestamp: currentTimestamp });
          // Actualiza la variable local también
          this.lastZeroMessageTimestamp = currentTimestamp;
        }
      }
    } catch (error) {
      console.error('Error checking and resetting message limit:', error);
    }
  }


  async subscribeToMessagesLimit(userId: string) {
    this.firestore.collection('users').doc(userId).valueChanges().subscribe((userData: any) => {
      if (userData && userData.messagesLimit !== undefined) {
        this.messagesLimit = userData.messagesLimit;
        if (this.messagesLimit === 0) {
          this.lastZeroMessageTimestamp = userData.lastZeroMessageTimestamp;
        }
      }
    });
  }

  async createZeroMessageTimestamp(userId: string) {
    try {
      const userDocRef = this.firestore.collection('users').doc(userId);
      const userDocSnap = await userDocRef.get().toPromise();
      if (userDocSnap && userDocSnap.exists) {
        const userData = userDocSnap.data() as { lastZeroMessageTimestamp?: firebase.firestore.Timestamp };
        if (!userData?.lastZeroMessageTimestamp) {
          // Solo crea el timestamp si aún no existe en el documento
          await userDocRef.update({ lastZeroMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp() });
        }
      }
    } catch (error) {
      console.error('Error creating zero message timestamp:', error);
    }
  }



  async submit() {
    const userIds = this.userService.getUserId();
    if (!userIds) {
      console.error('User ID is undefined');
      return;
    }
    
    if (this.form.valid) {
      let promt = this.form.value.promt as string;
     await this.checkAndResetMessageLimit(userIds);
      
      if (this.messagesLimit <= 0) {
        this.showMessagesLimitAlert();
        return; // Detener el proceso de envío de mensaje si no hay mensajes restantes
      }


      if (this.messagesLimit === 0) {
        // Actualiza el timestamp a la hora actual
        const currentTimestamp = firebase.firestore.Timestamp.now();
        // Actualiza el timestamp en la base de datos
        const userId = this.userService.getUserId();
        await this.firestore.collection('users').doc(userId).update({ lastZeroMessageTimestamp: currentTimestamp });
        // Actualiza la variable local también
        this.lastZeroMessageTimestamp = currentTimestamp;
    }
    
  
      // Enviar el mensaje solo si hay mensajes restantes
      if (this.messagesLimit > 0) {
        // mensaje del usuario
        let userMsg: Message = { sender: 'me', content: promt };
        this.messages.push(userMsg);
      }

      // mensaje del usuario
      let botMsg: Message = { sender: 'bot', content: '' };
      this.messages.push(botMsg);

      this.scrollToBottom();
      this.form.reset();
      this.form.disable();
      this.loading = true;

      // Obtén el ID de usuario después de la autenticación
      const userId = this.userService.getUserId();


      if (userId !== undefined) {
        try {
          await this.decrementMessageLimit(userId); // Aquí agregamos await
          this.openAi.sendQuestion(promt, userId).subscribe({
            next: (res: any) => {
              this.typeText(res.bot.content);
              this.loading = false;
              this.form.enable();
          
              // Guardar mensajes en la colección de mensajes del usuario
              this.openAi.sendQuestion(promt, res.bot.content);
            },
            error: (error: any) => {
              console.log(error);
            },
          });
        } catch (error) {
          console.error('Error during message limit decrement:', error);
        }
      } else {
        console.error('Usuario no autenticado');
      }
    }
  }

  typeText(text: string) {
    let textIndex = 0;
    let messagesLastIndex = this.messages.length - 1;

    let interval = setInterval(() => {
      if (textIndex < text.length) {
        this.messages[messagesLastIndex].content += text.charAt(textIndex);
        textIndex++;
      } else {
        clearInterval(interval);
        this.scrollToBottom();
      }
    }, 15)
  }

  scrollToBottom() {
    this.content.scrollToBottom(2000);
  }

  volver2(){
    this.router.navigate(['/principal2']);
  }

  getBotImageUrl(choice: number): string {
    switch (choice) {
      case 1:
        return 'https://i.ibb.co/vw0LdKr/pesantez.png'
      case 2:
        return 'https://i.ibb.co/R4shwS8/Suri.png'
      case 3:
        return 'https://i.ibb.co/vsw4jKp/Panjon.png'
      case 4:
        return 'https://i.ibb.co/7S4H9tP/S-ria.png'
      case 5:
        return 'https://i.ibb.co/Tb6jRcn/Amelia.png'
      case 6:
        return 'https://i.ibb.co/Lv2wM6D/Sara.png'
      default:
        return 'https://w1.pngwing.com/pngs/278/853/png-transparent-line-art-nose-chatbot-internet-bot-artificial-intelligence-snout-head-smile-black-and-white.png'; // En caso de elección inválida
    }
  }
  async decrementMessageLimit(userId: string) {
    try {
      const userDocRef = this.firestore.collection('users').doc(userId);
      const userDocSnap = await userDocRef.get().toPromise();
      if (userDocSnap && userDocSnap.exists) {
        const userData = userDocSnap.data() as { messagesLimit?: number };
        let currentLimit = userData?.messagesLimit || 0;
        if (currentLimit > 0) {
          currentLimit--;
          await userDocRef.update({ messagesLimit: currentLimit });
          return currentLimit;
        } else {
          console.log('El límite de mensajes ya es cero.');
          // Obtiene la marca de tiempo actual
          const currentTimestamp = firebase.firestore.Timestamp.now();
          // Actualiza el timestamp a la hora actual
          await userDocRef.update({ messagesLimit: currentLimit, lastZeroMessageTimestamp: currentTimestamp });
          // Actualiza la variable local también
          this.lastZeroMessageTimestamp = currentTimestamp;
          return currentLimit;
        }
      } else {
        console.error('El documento de usuario no existe o es undefined.');
        return -1;
      }
    } catch (error) {
      console.error('Error al decrementar el límite de mensajes:', error);
      return -1;
    }
  }

  async showMessagesLimitAlert() {
    const alert = await this.alertController.create({
      header: 'Límite de mensajes alcanzado',
      message: 'Se te han acabado los mensajes disponibles.',
      buttons: ['OK']
    });
    await alert.present();
    this.form.disable();
  }
}