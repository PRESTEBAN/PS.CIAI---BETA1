import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'PSYAPP',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",//Icono de la app solo para Android
      iconColor: "#488AFF",//Color de Icono
      sound: "beep.wav",//Sonido de la notificacion solo para Android
    },
  },
};

export default config;
