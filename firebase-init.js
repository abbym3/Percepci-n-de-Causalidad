import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDa7zR-xvvO9_6AxZc5PEVgx0dhWOm9Yjs",
  authDomain: "causalidad-web.firebaseapp.com",
  projectId: "causalidad-web",
  storageBucket: "causalidad-web.appspot.com",
  messagingSenderId: "1027187700687",
  appId: "1:1027187700687:web:bba7005849be9bb7d798ba",
  databaseURL: "https://causalidad-web-default-rtdb.firebaseio.com" 
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

signInAnonymously(auth)  
.catch((error) => {
    console.error("Error al autenticar:", error.code, error.message);
  });