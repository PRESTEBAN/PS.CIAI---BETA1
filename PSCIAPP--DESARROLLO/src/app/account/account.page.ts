import { Component, OnInit } from '@angular/core';
import { UserService } from './../services/user.service';
import { Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit {

  nombreUsuario: string = '';
  userEmail: string | null = null;
  genero: string | null = null;
  Nacimiento: string | null = null;
  edad: number | null = null;
  

  constructor(private userService: UserService, private router: Router,private firestore: AngularFirestore) { }

  async ngOnInit() {
    const userId = this.userService.getUserId();
    if (!userId) {
      this.nombreUsuario = 'Invitado';    // Si no se encuentra el ID de usuario, establece el nombre como 'Invitado'
      return;
    }
    
    this.userEmail = await this.getUserEmail(userId);
    
    this.userService.getUserNameFromDatabase(userId).then(name => {
      this.nombreUsuario = name;
    });

    this.getGeneroFromDatabase(userId).then(genero => {
      this.genero = genero;
    });

    this.getNacimientoFromDatabase(userId).then(fechaNacimiento => {
      this.Nacimiento = fechaNacimiento;
    });

    this.getEdadFromDatabase(userId).then(edad => {
      this.edad = edad;
    });
  }

async getGeneroFromDatabase(userId: string): Promise<string | null> {
  try {
    const formDataCollectionRef: AngularFirestoreCollection<any> = this.firestore.collection<any>('form-data-Correo', ref => ref.where('userId', '==', userId).limit(1));
    const snapshot = await formDataCollectionRef.get().toPromise();
    if (snapshot && !snapshot.empty) {
      const userData = snapshot.docs[0].data();
      if (this.isValidUserData(userData)) {
        return userData.genero || 'Desconocido';
      }
    }
    return 'Desconocido';
  } catch (error) {
    console.error('Error al obtener el género desde la base de datos:', error);
    return 'Desconocido';
  }
}
  
  private isValidUserData(userData: any): userData is { genero: string } {
    return typeof userData === 'object' && userData !== null && typeof userData.genero === 'string';
  }

  async getNacimientoFromDatabase(userId: string): Promise<string | null> {
    try {
      const formDataCollectionRef: AngularFirestoreCollection<any> = this.firestore.collection<any>('form-data-Correo', ref => ref.where('userId', '==', userId).limit(1));
      const snapshot = await formDataCollectionRef.get().toPromise();
      if (snapshot && !snapshot.empty) {
        const userData = snapshot.docs[0].data();
        if (this.isValidUserData2(userData)) {
          return userData.fechaNacimiento|| 'Desconocido';
        }
      }
      return 'Desconocido';
    } catch (error) {
      console.error('Error al obtener el género desde la base de datos:', error);
      return 'Desconocido';
    }
  }
    
    private isValidUserData2(userData: any): userData is { fechaNacimiento: string } {
      return typeof userData === 'object' && userData !== null && typeof userData.fechaNacimiento === 'string';
    }

    async getEdadFromDatabase(userId: string): Promise<number | null> {
      try {
          const formDataCollectionRef: AngularFirestoreCollection<any> = this.firestore.collection<any>('form-data-Correo', ref => ref.where('userId', '==', userId).limit(1));
          const snapshot = await formDataCollectionRef.get().toPromise();
          if (snapshot && !snapshot.empty) {
              const userData = snapshot.docs[0].data();
              if (this.isValidUserData3(userData)) {
                  // Utiliza la edad directamente
                  return userData.edad || null;
              }
          }
          return null;
      } catch (error) {
          console.error('Error al obtener la edad desde la base de datos:', error);
          return null;
      }
  }
  
  private isValidUserData3(userData: any): userData is { edad: number } {
      return typeof userData === 'object' && userData !== null && typeof userData.edad === 'number';
  }
    
  irChat(){
    this.router.navigate(['/chat']);
  }

  irPrincipal2(){
    this.router.navigate(['/principal2']);
  }
  irAccount(){
    this.router.navigate(['/account']);
  }

  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const userDoc = await this.firestore.collection('users').doc(userId).get().toPromise();
      if (userDoc?.exists) {
        const userData = userDoc.data() as { email?: string }; // Tipo explícito para userData
        if (userData && userData.email) {
          return userData.email;
        }
        return null;
      } else {
        console.error('El documento del usuario no existe');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
      return null;
    }
  }

  logout() {  
    this.userService.logout().then(() => {
      this.router.navigate(['/home']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }  
}


