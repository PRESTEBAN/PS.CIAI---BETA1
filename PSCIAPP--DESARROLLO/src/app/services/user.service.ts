// user.service.ts
import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  public auth: Auth;
  public firestore: AngularFirestore;
  

  constructor(auth: Auth, firestore: AngularFirestore, private http: HttpClient) {
    this.auth = auth;
    this.firestore = firestore;
  }

  async register({ email, password }: any) {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const userId = userCredential.user?.uid;

    const userCollectionRef = this.firestore.collection(`users`);
    await userCollectionRef.doc(userId).set({ email, messagesLimit: 15 });


    // Almacena la referencia a la colección de mensajes en Firestore
    const userMessagesRef = userCollectionRef.doc(userId).collection('messages');
    await userMessagesRef.add({ initial: 'message' });

    return userCredential;
  }

  login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  saveUserChoice(userId: string, choice: number) {
    // Referencia al documento del usuario en Firestore
    const userDocRef = this.firestore.collection('users').doc(userId);

    // Actualizar el documento del usuario con la elección del usuario
    return userDocRef.update({
      choice: choice // Asigna la elección del usuario al atributo "choice"
    }).catch(error => {
      console.error('Error al guardar la elección del usuario:', error);
    });
  }

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(this.auth);
  }

  getUserId() {
    return this.auth.currentUser?.uid;
  }

  getFirestore() {
    return this.firestore;
  }

  getUserMessagesRef(userId: string) {
    return userId ? this.firestore.collection(`users/${userId}/messages`) : null;
  }

  getUserEmail() {
    return this.auth.currentUser?.email;
  }
  
  getUserMessagesRefByEmail(userEmail: string) {
    return userEmail ? this.firestore.collection(`users/${userEmail}/messages`) : null;
  }

  getUserName(): string {
    const userId = this.getUserId();
    const storedName = userId ? localStorage.getItem(`userNombre_${userId}`) : null;
    return storedName || 'Invitado';
}

 getUserNameCorreo(): string {
  const userId = this.getUserId();
  const storedName = userId ? localStorage.getItem(`correoContraseñaNombre_${userId}`) : null;
  return storedName || 'Invitado';
 }

  async saveFormData(userId: string, nombre: string, fechaNacimiento: string, genero: string) {
    try {
      // Crear una referencia a la colección form-data
      const formDataCollectionRef = this.firestore.collection(`form-data`);

      // Guardar datos del formulario en la colección form-data
      await formDataCollectionRef.add({
        userId,
        nombre,
        fechaNacimiento,
        genero,
        timestamp: new Date(),
      });

      console.log('Form data saved successfully.');
      localStorage.setItem(`userNombre_${userId}`, nombre);
      
    } catch (error) {
      console.error('Error saving form data:', error);
    }

  }

    async getUserNameFromDatabase(userId: string): Promise<string> {
      try {
        const formDataCollectionRef: AngularFirestoreCollection<any> = this.firestore.collection<any>('form-data-Correo', ref => ref.where('userId', '==', userId).limit(1));
        const snapshot = await formDataCollectionRef.get().toPromise();
        if (snapshot && !snapshot.empty) { // Verificar que snapshot no sea undefined y que no esté vacío
          const userData = snapshot.docs[0].data();
          if (this.isValidUserData(userData)) {
            return userData.nombre || 'Invitado';
          }
        }
        return 'Invitado';
      } catch (error) {
        console.error('Error al obtener el nombre desde la base de datos:', error);
        return 'Invitado';
      }
    }
    
  

  private isValidUserData(userData: any): userData is { nombre: string } {
    return typeof userData === 'object' && userData !== null && typeof userData.nombre === 'string';
  }

  async saveFormDataCorreo(userId: string, nombre: string, fechaNacimiento: string, genero: string, edad: number) {
    try {
      // Crear una referencia a la colección form-data-Correo
      const formDataCollectionRef = this.firestore.collection(`form-data-Correo`);

      // Guardar datos del formulario en la colección form-data-Correo
      await formDataCollectionRef.add({
        userId,
        nombre,
        fechaNacimiento,
        genero,
        edad: edad,
        timestamp: new Date(),
      });

      console.log('Form data saved successfully (Correo).');
      localStorage.setItem(`userNombre_${userId}`, nombre);


    } catch (error) {
      console.error('Error saving form data (Correo):', error);
    }
  }

  async saveUserMessage(userId: string, userMessage: string, botMessage: string) {
  try {
    // Crear una referencia a la colección de mensajes del usuario
    const userMessagesRef = this.firestore.collection(`users/${userId}/messages`);

    // Guardar mensaje de usuario
    await userMessagesRef.add({
      sender: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Guardar mensaje de bot
    await userMessagesRef.add({
      sender: 'bot',
      content: botMessage,
      timestamp: new Date(),
    });
    // Crear una referencia a la nueva colección para los datos del formulario
    const formDataRef = this.firestore.collection(`form-data`);
    // Guardar datos del formulario
    await formDataRef.add({
      userId: userId,
      userName: userMessage, // Puedes ajustar este campo según tus necesidades
      birthdate: botMessage, // Puedes ajustar este campo según tus necesidades
      timestamp: new Date(),
    });
    console.log('Messages and form data saved successfully.');
  } catch (error) {
    console.error('Error saving messages and form data:', error);
   }
  }
}
