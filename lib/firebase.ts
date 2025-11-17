import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth"
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
}

const apps = getApps()
const app = apps.length ? getApp() : initializeApp(firebaseConfig)

export const auth = apps.length
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) })
export const db = getFirestore(app)
