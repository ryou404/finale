// 使用 CDN 連結引入 Firebase SDK (適用於瀏覽器直接運行)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 你的 Firebase 設定 (根據你提供的資訊填寫)
const firebaseConfig = {
  apiKey: "AIzaSyAPnxw6I6cFxBsvZiSufmDPQmuJkY7jo-g",
  authDomain: "ai-resume-health-check.firebaseapp.com",
  projectId: "ai-resume-health-check",
  storageBucket: "ai-resume-health-check.firebasestorage.app",
  messagingSenderId: "659646169112",
  appId: "1:659646169112:web:d11eccae4f6abfa56a436d",
  measurementId: "G-5E2C8FJWX5"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化各項服務
const auth = getAuth(app);
const db = getFirestore(app);

// 匯出變數與函式，供 index.html, brand_test.html, career_fit.html 使用
export { 
    auth, db, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile,
    doc, setDoc, getDoc, updateDoc
};