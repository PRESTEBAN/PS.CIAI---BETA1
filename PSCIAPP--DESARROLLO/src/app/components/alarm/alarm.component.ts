import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

@Component({
  selector: 'app-alarm',
  templateUrl: './alarm.component.html',
  styleUrls: ['./alarm.component.scss'],
})
export class AlarmComponent  implements OnInit {

  activationTime: string = '';

  constructor() {
    this.checkAlarmTime();
  }

  ngOnInit(): void {
    
  }

  saveAlarmSettings() {
    const alarmRef = firebase.database().ref('alarma/BblwnRs6OCubgG5c0zL5/activationTime');
    alarmRef.set(this.activationTime);
  }

  checkAlarmTime() {
    const alarmRef = firebase.database().ref('alarma/BblwnRs6OCubgG5c0zL5/activationTime');
    alarmRef.on('value', (snapshot) => {
      const activationTime = snapshot.val();
      if (activationTime) {
        const now = new Date();
        const currentTime = `${now.getHours()}:${now.getMinutes()}`;
        if (currentTime === activationTime) {
          this.activateVariables();
        }
      }
    });
  }

  activateVariables() {
    const deviceRef = firebase.database().ref('Dispositivos');
    deviceRef.update({
      Led: true,
      Led2: true,
      Motor: true,
      Motor2: true,
      parlante: true
    });

    setTimeout(() => {
      deviceRef.update({
        Led: false,
        Led2: false,
        Motor: false,
        Motor2: false,
        parlante: false
      });
    }, 20000);
  }


}
