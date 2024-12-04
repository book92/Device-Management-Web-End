import { getStorage} from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyApBWUABXIusWxrlvdBt9ttvTd0uSISTQY",
    authDomain: "device-management-43211.firebaseapp.com",
    projectId: "device-management-43211",
    storageBucket: "device-management-43211.appspot.com",
    messagingSenderId: "380746467890",
    appId: "1:380746467890:android:d3c0f214afd02c9b390a2b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
