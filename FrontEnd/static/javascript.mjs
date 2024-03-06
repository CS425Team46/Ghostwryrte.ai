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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const fileUploadWindow = document.querySelector('.fileUploadWindow');
const uploadedDocsList = document.querySelector('.uploadedDocs');
const accPageCheck = document.getElementById('accPage');
const LOButton = document.getElementById('LOButton');
var ACUserOption = 1; // 1 = Sign In & 2 = Sign Up

auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, set the user_id in the hidden form field
        const userIdField = document.getElementById('formUserId');
        if (userIdField) {
            userIdField.value = user.uid;
        }
    } else {
        // User is signed out
        console.log("No user signed in");
        // Optional: Redirect to login page or show a message
    }
});

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

}

if(accPageCheck){

    const signInButton = document.getElementById('signInBtn');
    const signUpButton = document.getElementById('signUpBtn');
    const ACSubmit = document.getElementById('ACSubmit');
    
    document.getElementById('userSubmitForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        if (ACUserOption == 1){
            handleSignIn(email, password);
        } else {
            handleSignUp(email, password);
        }
        
    }, false);

    signInButton.addEventListener('click', function() {

        signInButton.style.color = 'var(--textAndAccentFour)';
        signInButton.style.borderBottom = '3px solid var(--textAndAccentFour)';
        signUpButton.style.color = 'var(--deselectedColor)';
        signUpButton.style.borderBottom = '3px solid var(--deselectedColor)';
        ACUserOption = 1;

    });

    signUpButton.addEventListener('click', function() {
        
        signUpButton.style.color = 'var(--textAndAccentFour)';
        signUpButton.style.borderBottom = '3px solid var(--textAndAccentFour)';
        signInButton.style.color = 'var(--deselectedColor)';
        signInButton.style.borderBottom = '3px solid var(--deselectedColor)';
        ACUserOption = 0;
    
    });
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
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Signup successful', userCredential.user);
        })
        .catch(error => {
            console.error('Signup failed', error.code, error.message);
        });
}

function handleSignIn() {

    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Signin successful', userCredential.user);
            window.location.href = '/content-generation';
        })
        .catch(error => {
            console.error('Signin failed', error.code, error.message);
        });
}

const uploadDataButton = document.getElementById('UploadData');
if (uploadDataButton) {
    uploadDataButton.addEventListener('click', () => {
        const user = auth.currentUser; // Ensure you get the current user here
        if (user) { // Check if user exists
            console.log("Upload Data button clicked");
            fetch('/run-data-conversion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.uid })  // Now 'user' should be defined
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                alert('Data conversion initiated.');
            })
            .catch(error => {
                console.error('Error starting data conversion:', error);
            });
        } else {
            console.log("No user signed in");
            alert("Please sign in to upload data");
        }
    });
}


const trainModelButton = document.getElementById('TrainModel');
if (trainModelButton) {
    trainModelButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            console.log("Train Model button clicked");
            fetch('/start-model-training', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.uid })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                alert(data.message);
            })
            .catch(error => {
                console.error('Error starting model training:', error);
            });
        } else {
            console.log("No user signed in");
            alert("Please sign in to start model training");
        }
    });
}





