import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, query, orderBy, limit, doc, setDoc, serverTimestamp, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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

/* AI Training Page */
const fileUploadWindow = document.querySelector('.innerUploadWrapper');
const uploadedDocsList = document.querySelector('.uploadedFiles');
/* Account Creation Page */
const accPageCheck = document.getElementById('accPage');
const LOButton = document.getElementById('LOButton');
/* Content Generation Page */
const genButtonID = document.getElementById('genButtonID');
const historyContentWindow = document.querySelector('.historyContentWindow');
const historyInstance = document.createElement('div');
const contentWindow = document.querySelector('.contentGenWindow');

var ACUserOption = 1; // 1 = Sign In & 2 = Sign Up

auth.onAuthStateChanged((user) => {
    if (user) {
        const userIdField = document.getElementById('formUserId');
        if (userIdField) {
            userIdField.value = user.uid;
        }
        if (contentWindow){
            callUpload();
            loadHistoryButtons(); 
        }
        setEmailOnPage();
    } else {
        console.log("No user signed in");
    }
});

function setEmailOnPage() {

    const user = auth.currentUser;
    var emailContainer = document.getElementById('emailContainer');
    emailContainer.textContent = user.email;

}

/* Content Generation Page */

function callUpload() {
    if(contentWindow){
        var content = document.getElementsByTagName('pre')[0].innerHTML;
        if(content){
            const newContent = content
            const title = extractTitle(content);
            uploadHistory(title, newContent);
        } 
    }
}
async function uploadHistory(title, fileContent) {

    var user = auth.currentUser;
    if (user) {
        await setDoc(doc(db, 'users', user.uid, 'history', title), {
            title: title,
            content: fileContent,
            time: serverTimestamp()
            });
    } else {
        console.error('No user is signed in to generate history');
    }

}

async function loadHistoryButtons() {
    const user = auth.currentUser;
    if (user) {
        const historyRef = collection(db, `users/${user.uid}/history`);
        const q = query(historyRef, orderBy('time', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
            const title = doc.data().title;
            const content = doc.data().content;
            createHistoryButton(title, content);
        });
    } else {
        console.error('No user is signed in to load history');
    }
}

function createHistoryButton(title, content) {
    const historyButton = document.createElement('button');
    const buttonText = document.createElement('span');

    buttonText.textContent = title;
    buttonText.classList.add('innerHistorySpan'); 
    historyButton.appendChild(buttonText); 
    historyButton.classList.add('historyInstance');

    historyButton.addEventListener('click', () => {
        document.getElementsByTagName('pre')[0].innerHTML = content;
    });
    historyContentWindow.appendChild(historyButton);
}

/* AI Training Page */

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
        let title = file.name;
        const dotIndex = title.lastIndexOf('.');
        title = title.substring(0, dotIndex) + title.substring(dotIndex).toLowerCase();
        fileUpload(title, fileContent);
    };

    reader.readAsText(file);
}

function extractTitle(fileContent) {
    const sentences = fileContent.split('.');
    return sentences[0].trim();
}

function fileUpload(title, fileContent) {
    const uploadedFileInstance = document.createElement('div');
    uploadedFileInstance.classList.add('uploadedFileInstance');

    const img = document.createElement('img');
    img.setAttribute('src', "./static/images/textFile.png");
    img.classList.add('fileInstanceImgTxt');
    uploadedFileInstance.appendChild(img);

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = title;
    fileNameSpan.classList.add('fileName');
    uploadedFileInstance.appendChild(fileNameSpan);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('deleteFileButton');
    deleteButton.addEventListener('click', function() {
        uploadedDocsList.removeChild(uploadedFileInstance);
    });
    
    const deleteImg = document.createElement('img');
    deleteImg.setAttribute('src', "./static/images/redx.png");
    deleteImg.classList.add('fileInstanceImgX');
    deleteButton.appendChild(deleteImg);

    uploadedFileInstance.appendChild(deleteButton);

    uploadedDocsList.appendChild(uploadedFileInstance);

    uploadedFileInstance.setAttribute('fileContent', fileContent);

    /* uploadToFirebase(title, fileContent); */
}

function uploadAllFilesToFirebase() {

    const uploadedFileInstances = document.querySelectorAll('.uploadedFileInstance');
    uploadedFileInstances.forEach(fileInstance => {

        const title = fileInstance.querySelector('.fileName').textContent;
        const fileContent = fileInstance.getAttribute('fileContent');
        
        uploadToFirebase(title, fileContent)
            .then(() => {
                fileInstance.remove();
            })
            .catch(error => {
                console.error('Error uploading file:', error);
            });
    });

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

const uploadDataButton = document.getElementById('UploadData');
if (uploadDataButton) {
    uploadDataButton.addEventListener('click', () => {
        const user = auth.currentUser; 
        if (user) {
            uploadAllFilesToFirebase();
            console.log("Upload Data button clicked");
            fetch('/run-data-conversion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.uid }) 
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


/* Account Creation Page */

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

        signInButton.style.color = 'var(--textColor)';
        signInButton.style.borderBottom = '5px solid var(--textColor)';
        signUpButton.style.color = 'var(--deselectedColor)';
        signUpButton.style.borderBottom = '5px solid var(--deselectedColor)';
        ACUserOption = 1;

    });

    signUpButton.addEventListener('click', function() {
        
        signUpButton.style.color = 'var(--textColor)';
        signUpButton.style.borderBottom = '5px solid var(--textColor)';
        signInButton.style.color = 'var(--deselectedColor)';
        signInButton.style.borderBottom = '5px solid var(--deselectedColor)';
        ACUserOption = 0;
    
    });
}

if(LOButton){
    LOButton.addEventListener('click', function() {
        signOut(auth).then(() => {
            console.log('User signed out.');
            window.location.href = '/'
        }).catch((error) => {
            console.error('Signout Error', error.code, error.message);
        });
    }, false);
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





