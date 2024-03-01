import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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
const db = getFirestore(app);
const auth = getAuth(app);

const fileUploadWindow = document.querySelector('.fileUploadWindow');
const uploadedDocsList = document.querySelector('.uploadedDocs');
const signUpForm = document.getElementById('signupForm');
const LOButton = document.getElementById('LOButton');

if (fileUploadWindow) {
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


    // Add other event listeners related to fileUploadWindow here...
}

if(signUpForm){

    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        handleSignUp(email, password);
    }, false);
    
    document.getElementById('signinForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;
        handleSignIn(email, password);
    }, false);

}

if(LOButton){
    LOButton.addEventListener('click', function() {
        console.log("Hello world");
        signOut(auth).then(() => {
            console.log('User signed out.');
            window.location.href = '/'
        }).catch((error) => {
            console.error('Signout Error', error.code, error.message);
        });
    }, false);
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

    const user = auth.currentUser;
    if (user) {
        await setDoc(doc(db, 'users', user.uid, 'files', title), {
            Title: title,
            Content: fileContent,
            });
    } else {
        console.error('No user is signed in to upload data');
    }
}

function handleSignUp() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Signup successful', userCredential.user);
        })
        .catch(error => {
            console.error('Signup failed', error.code, error.message);
        });
}

function handleSignIn() {

    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Signin successful', userCredential.user);
            window.location.href = '/content-generation'; // Redirect the user
        })
        .catch(error => {
            console.error('Signin failed', error.code, error.message);
        });
}


