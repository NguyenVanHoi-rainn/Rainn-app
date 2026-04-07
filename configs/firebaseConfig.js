import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBstrssSiAmaEuPBUApQ0DLU59Z8zuOnec",
  authDomain: "rainn-app-efdf9.firebaseapp.com",
  projectId: "rainn-app-efdf9",
  storageBucket: "rainn-app-efdf9.firebasestorage.app",
  messagingSenderId: "860770769596",
  appId: "1:860770769596:web:2df0029ea24efa08e94eb9",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
