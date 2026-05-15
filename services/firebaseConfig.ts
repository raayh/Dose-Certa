import { initializeApp } from "firebase/app";
// @ts-ignore (Erro falso-positivo do TypeScript com o React Native+Firebase)
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Aqui nós "puxamos" as chaves do seu arquivo secreto
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Se for celular (Native), injeta o AsyncStorage. Se for Web, deixa vazio para usar o padrão do Chrome.
export const auth = initializeAuth(
  app, 
  Platform.OS !== 'web' ? { persistence: getReactNativePersistence(ReactNativeAsyncStorage) } : {}
);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // 👈 Força o uso de requisições estáveis
});