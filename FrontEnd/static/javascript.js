import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that we want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyDW-idC8yzOs7HlFZ21sB5-H7UjRZ6N6hs",
  authDomain: "ghostwryte-ai.firebaseapp.com",
  projectId: "ghostwryte-ai",
  storageBucket: "ghostwryte-ai.appspot.com",
  messagingSenderId: "837044282202",
  appId: "1:837044282202:web:e5bc8ac9a865b8ee2cc963",
  measurementId: "G-MD1XND7LM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();

// Signup Function
function signUp(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log("Signup successful", user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Signup failed", errorCode, errorMessage);
        });
}

// Signin Function
function signIn(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log("Signin successful", user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Signin failed", errorCode, errorMessage);
        });
}

// Example usage
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    signUp(email, password);
});

document.getElementById('signinForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    signIn(email, password);
});
