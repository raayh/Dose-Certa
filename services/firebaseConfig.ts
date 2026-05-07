import { initializeApp } from "firebase/app";
// @ts-ignore (Erro falso-positivo do TypeScript)
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = { /* ... Suas Chaves ... */ };
const app = initializeApp(firebaseConfig);

// Configura o Auth separando a memória da Web e do Celular
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence 
    : getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);