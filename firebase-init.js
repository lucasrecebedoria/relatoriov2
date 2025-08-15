// Inicializa o Firebase com sua configuração
const firebaseConfig = {
  apiKey: "AIzaSyBdmIYK4Zy6MbEsT3pc5W_YkbdKtOUOzto",
  authDomain: "caixas-b09fb.firebaseapp.com",
  projectId: "caixas-b09fb",
  storageBucket: "caixas-b09fb.firebasestorage.app",
  messagingSenderId: "93898531144",
  appId: "1:93898531144:web:d62e34c97865133644137d",
  measurementId: "G-SSWHWFZ7FT"
};

firebase.initializeApp(firebaseConfig);
if (firebase.analytics) {
  firebase.analytics();
}


const db = firebase.firestore();
