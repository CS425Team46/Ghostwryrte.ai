import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js'

const firebaseConfig = {
  apiKey: "AIzaSyDW-idC8yzOs7HlFZ21sB5-H7UjRZ6N6hs",
  authDomain: "ghostwryte-ai.firebaseapp.com",
  projectId: "ghostwryte-ai",
  storageBucket: "ghostwryte-ai.appspot.com",
  messagingSenderId: "837044282202",
  appId: "1:837044282202:web:e5bc8ac9a865b8ee2cc963",
  measurementId: "G-MD1XND7LM3"
};

document.addEventListener('DOMContentLoaded', () => {
    const fileUploadWindow = document.querySelector('.fileUploadWindow');
    const uploadedDocsList = document.querySelector('.uploadedDocs');
    const signInButton     = document.querySelector('.signInButton');
    const signUpButton     = document.querySelector('.signUpButton');
    const auth = initializeAuth();

    fileUploadWindow.addEventListener('dragover', (event) => {
        event.preventDefault();
        fileUploadWindow.classList.add('dragover');
    });

    fileUploadWindow.addEventListener('dragleave', () => {
        fileUploadWindow.classList.remove('dragover');
    });

    fileUploadWindow.addEventListener('drop', (event) => {
        event.preventDefault();
        fileUploadWindow.classList.remove('dragover');

        const files = event.dataTransfer.files;
        fileProcessing(files);
    });

    fileUploadWindow.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        fileInput.multiple = true;

        fileInput.click();

        fileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            fileProcessing(files);
        });
    });

    document.getElementById('signUpButton').addEventListener('click', function() {
        console.log("Sign Up button clicked");
        document.getElementById('signUp').classList.add('signButtonClicked');
        document.getElementById('signIn').classList.remove('signButtonClicked');
    });

    // Function to handle sign in button click
    document.getElementById('signInButton').addEventListener('click', function() {
        console.log("Sign In button clicked");
        document.getElementById('signIn').classList.add('signButtonClicked');
        document.getElementById('signUp').classList.remove('signButtonClicked');
    });

    function initializeAuth() {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      return auth;
    }

    function fileProcessing(files) {
        for (const file of files) {
            if (file.type === 'text/plain') {
                readAndUploadFile(file);
            } else {
                alert('Only .txt files are accepted.');
            }
        }
    }

    function readAndUploadFile(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result;
            const title = extractTitle(fileContent);
            fileUpload(title, fileContent);
        };

        reader.readAsText(file);
    }

    function extractTitle(fileContent) {
        const sentences = fileContent.split('.');
        return sentences[0].trim();
    }

    function fileUpload(title, fileContent) {
        const listItem = document.createElement('li');
        listItem.textContent = title;
        uploadedDocsList.appendChild(listItem);

        uploadToFirebase(title, fileContent);
    }

    async function uploadToFirebase(title, fileContent) {

        const app = initializeApp(firebaseConfig); 
        const db = getFirestore(app);

        await setDoc(doc(db, "DataSamples", title), {
          Title: title,
          Content: fileContent,
        });
    }

    function signUp(email, password) {
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Signup successful", user);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Signup failed", errorCode, errorMessage);
            });
    }

    function signIn(email, password) {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Signin successful", user);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Signin failed", errorCode, errorMessage);
            });
    }


});
