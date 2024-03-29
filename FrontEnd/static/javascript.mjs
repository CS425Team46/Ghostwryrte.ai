import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, query, orderBy, limit, doc, setDoc, serverTimestamp, getDocs, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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
const fileUploadWindow      = document.querySelector('.innerUploadWrapper');
const uploadedDocsList      = document.querySelector('.uploadedFiles');
/* Account Creation Page */
const accPageCheck          = document.getElementById('accPage');
const LOButton              = document.getElementById('LOButton');
var ACUserOption            = 1; // 1 = Sign In & 2 = Sign Up
/* Content Generation Page */
const genButtonID           = document.getElementById('genButtonID');
const historyInstance       = document.createElement('div');
const contentWindow         = document.querySelector('.contentGenWindow');
const copyButton            = document.querySelector('.copyButton');
const titleInput            = document.querySelector('.titleText');
let newChatButton           = document.getElementById('newChat');
let historyContentWindow    = document.querySelector('.historyContentWindow');

auth.onAuthStateChanged((user) => {
    if (user) {
        const userIdField = document.getElementById('formUserId');
        if (userIdField) {
            userIdField.value = user.uid;
        }
        if (contentWindow){
            selectHistoryContentWindow();
            callUpload();
            loadHistoryButtons(); 
            checkForContent();
        }
        if(!accPageCheck){
            /* setEmailOnPage(); */
        }
    } else {
        if(!accPageCheck){ // I don't think this will break anything. If no user is signed in, dont let them onto the page.
            window.location.href = '/';
        }   
        console.log("No user signed in");
    }
});

function setEmailOnPage() {

    const user = auth.currentUser;
    var emailContainer = document.getElementById('emailContainer');
    emailContainer.textContent = user.email;

}

/* Content Generation Page */

if (contentWindow) {
    

    document.querySelector('.copyButton').addEventListener('click', (event) => {
        event.preventDefault();
        var content = document.querySelector('pre'); 

        var range = document.createRange();
        range.selectNodeContents(content);

        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();

        var img = document.getElementById('copyImg');
        img.setAttribute('src', "./static/images/checkmark.svg");

        setTimeout(() => {
            img.setAttribute('src', "./static/images/clipboard.png");
        }, 1000); 
    });

    document.querySelector('.queryBox').addEventListener('input', handlePromptChange);
    function handlePromptChange() {
        checkForContent(); 
    }

    genButtonID.addEventListener('click', function(event) {
        const arrowImg = document.getElementById('upArrowImg');
        const loader = document.getElementById('circleLoader');
        genButtonID.style.pointerEvents = 'none';
        arrowImg.style.display = 'none';
        loader.style.display = 'block';
    });

    titleInput.addEventListener('blur', updateTitle);

    titleInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            updateTitle();
        }
    });

    titleInput.addEventListener('focus', function(event) {
        titleInput.value = "";
    });
    
    function updateTitle() {
        const newTitle = titleInput.value.trim();
        const selectedHistoryButton = document.querySelector('.historyInstance.selected');
        if(newTitle == ""){
            return;
        }
        if (selectedHistoryButton) {
            const oldTitle = selectedHistoryButton.textContent;
            selectedHistoryButton.querySelector('.innerHistorySpan').textContent = newTitle;
            updateHistoryInFirestore(oldTitle, newTitle);
        }
        titleInput.blur();
    }
    
    async function updateHistoryInFirestore(oldTitle, newTitle) {
        const user = auth.currentUser;
        if (user) {
            const oldHistoryRef = doc(db, 'users', user.uid, 'history', oldTitle);
            const oldHistoryDoc = await getDoc(oldHistoryRef);
    
            if (oldHistoryDoc.exists()) {
                console.log(oldHistoryDoc);
                const oldHistoryData = oldHistoryDoc.data();
                await setDoc(doc(db, 'users', user.uid, 'history', newTitle), {
                    title: newTitle,
                    content: oldHistoryData.content,
                    time: oldHistoryData.time
                });
                await deleteDoc(oldHistoryRef);
            } else {
                console.error('Document does not exist:', oldTitle);
            }
        } else {
            console.error('No user is signed in to update history');
        }
    }
   
    const debouncedResizeHandler = debounce(selectHistoryContentWindow, 250);
    window.addEventListener('resize', debouncedResizeHandler);
}
function selectHistoryContentWindow() {

    const screenWidth = window.innerWidth;
    const historyWrapperElements = document.querySelectorAll('.historyWrapper');

    if (screenWidth <= 991) { 
        historyContentWindow = historyWrapperElements[1].querySelector('.historyContentWindow');
        historyWrapperElements[0].querySelector('.historyContentWindow').style.display = "none";
        historyWrapperElements[1].querySelector('.historyContentWindow').style.display = "flex";
        loadHistoryButtons();
    } else {
        historyContentWindow = historyWrapperElements[0].querySelector('.historyContentWindow');
        historyWrapperElements[1].querySelector('.historyContentWindow').style.display = "none";
        historyWrapperElements[0].querySelector('.historyContentWindow').style.display = "flex";
        loadHistoryButtons();
    }
}

function checkForContent() {
    if (contentWindow) {
        var generatedContent = document.getElementsByTagName('pre')[0].innerHTML;
        var promptContent = document.querySelector('.queryBox').value.trim(); 

        if(generatedContent) {
            copyButton.style.visibility = 'visible';
            copyButton.style.pointerEvents = 'all';
        } else {
            copyButton.style.visibility = 'hidden';
            copyButton.style.pointerEvents = 'none';
        }
        if(promptContent) { 
            genButtonID.style.pointerEvents = 'all';
            genButtonID.style.background = "var(--mainAccentColor)";
            genButtonID.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.4)";
        } else {
            genButtonID.style.pointerEvents = 'none';
            genButtonID.style.background = "var(--secondaryColor)";
            genButtonID.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
        }        
    }
}

function debounce(func, delay) {
    let timer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

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
        showToast("No user is signed in to generate history", "danger", 5000);
        console.error('No user is signed in to generate history');
    }

}

async function loadHistoryButtons() {
    
    const user = auth.currentUser;
    if (user) {
        const historyRef = collection(db, `users/${user.uid}/history`);
        const q = query(historyRef, orderBy('time', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        while (historyContentWindow.firstChild) {
            historyContentWindow.removeChild(historyContentWindow.firstChild);
        }
        querySnapshot.forEach(doc => {
            const title = doc.data().title;
            const content = doc.data().content;
            createHistoryButton(title, content);
        });
    } else {
        showToast("No user is signed in to load history", "danger", 5000);
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
        titleInput.value = buttonText.textContent; 
        document.querySelector('.historyInstance.selected')?.classList.remove('selected'); 
        historyButton.classList.add('selected'); 
        document.getElementsByTagName('pre')[0].innerHTML = content;
        checkForContent();
    });

    historyContentWindow.appendChild(historyButton);
}

/* AI Training Page */

if (fileUploadWindow) {

    fileUploadWindow.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.txt';
            fileInput.multiple = true;

            fileInput.click();

            fileInput.addEventListener('change', (event) => {
                const files = event.target.files;
                fileProcessing(files);
            });
        }
    });
    
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
            showToast("Only .txt files are accepted", "warning", 5000);
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

}

function generateSessionId() {
    return new Date().getTime().toString();  // Convert time to string to use as a session ID
}

function extractFirstSentence(content) {
    const matches = content.match(/(.*?[.?!])(\s|$)/);
    return matches ? matches[1] : content;
}


function uploadAllFilesToFirebase(session_id) {
    return new Promise((resolve, reject) => {
        const uploadedFileInstances = document.querySelectorAll('.uploadedFileInstance');
        
        // Check if there are fewer than minimum number of entries files
        if (uploadedFileInstances.length < 10) {
            console.error('Error: Less than 10 files. Aborting upload.');
            reject('Please submit at least 10 files before uploading.');  
            return;  // Stop execution of the function
        }

        let uploadPromises = [];

        uploadedFileInstances.forEach(fileInstance => {
            const fileContent = fileInstance.getAttribute('fileContent');
            const title = extractFirstSentence(fileContent);  // Extract the first sentence to use as the title

            // Collect all upload promises
            uploadPromises.push(
                uploadToFirebase(title, fileContent, session_id)
                .then(() => {
                    fileInstance.remove(); // Remove the file instance from the UI after successful upload
                })
            );
        });

        // Wait for all uploads to complete
        Promise.all(uploadPromises).then(resolve).catch(reject);
    });
}

async function uploadToFirebase(title, fileContent, sessionId) {
    const app = initializeApp(firebaseConfig); 
    const db = getFirestore(app);
    const user = auth.currentUser;

    if (user) {
        // Use the session ID to create a unique directory for the user's current session
        await setDoc(doc(db, 'users', user.uid, `files_${sessionId}`, title), {
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
            const session_id = generateSessionId();
            uploadAllFilesToFirebase(session_id)
            .then(() => {
                console.log("Upload Data button clicked");
                return fetch('/run-data-conversion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: user.uid, session_id: session_id })
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                showToast("Data successfully uploaded!", "success", 5000); 
            })
            .catch(error => {
                showToast(error, "warning", 5000); 
                console.error('Error:', error);
            });
        } else {
            console.log("No user signed in");
            showToast("Please sign in to upload data", "danger", 5000); 
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
                if(data.message == "Model training script failed"){
                    showToast(data.message, "danger", 5000);
                } else{
                    showToast(data.message, "success", 5000);
                }
            })
            .catch(error => {
                console.error('Error starting model training:', error);
            });
        } else {
            console.log("No user signed in");
            showToast("Please sign in to start model training", "danger", 5000);
        }
    });
}

/* Account Creation Page */

if (accPageCheck) {
    const signInButton = document.getElementById('signInBtn');
    const signUpButton = document.getElementById('signUpBtn');
    const ACSubmit = document.getElementById('ACSubmit');
    var confirmPass = document.getElementById('confirmPassword');
    var confirmPassText = document.getElementById('confText');
    const signInAndUpWrapper = document.getElementById('SIAUW');

    document.getElementById('userSubmitForm').addEventListener('submit', function (event) {
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        event.preventDefault(); 
        confirmPass.setCustomValidity("");
        if (ACUserOption == 1) {
            handleSignIn(email, password);
        } else {
            if (confirmPass.value != password) { // If the password doesnt match the typed confirm password, report message
                confirmPass.setCustomValidity("Passwords don't match"); 
                confirmPass.reportValidity(); 
                return;
            } else {
                handleSignUp(email, password);
            }
        }
    });

    confirmPass.addEventListener('input', function() {
        confirmPass.setCustomValidity("");
        confirmPass.reportValidity(); 
    });

    signInButton.addEventListener('click', function () {
        
        ACUserOption = 1;
        ACSubmit.classList.remove('removed');
        

        signInButton.style.color = 'var(--textColor)';
        signInButton.style.borderBottom = '5px solid var(--textColor)';
        signUpButton.style.color = 'var(--deselectedColor)';
        signUpButton.style.borderBottom = '5px solid var(--deselectedColor)';

        confirmPass.setCustomValidity("");
        confirmPass.classList.remove('active');
        confirmPass.value = "";
        confirmPassText.classList.remove('active');   
        ACSubmit.textContent = "Log In";
    });
    
    signUpButton.addEventListener('click', function () {
        
        ACSubmit.classList.add('removed');

        signUpButton.style.color = 'var(--textColor)';
        signUpButton.style.borderBottom = '5px solid var(--textColor)';
        signInButton.style.color = 'var(--deselectedColor)';
        signInButton.style.borderBottom = '5px solid var(--deselectedColor)';

        confirmPass.classList.add('active');
        confirmPassText.classList.add('active');
    
        ACUserOption = 2;
        ACSubmit.textContent = "Sign Up";
    });
}

/* If NOT on the Account Creation Page */

if (!accPageCheck){
    newChatButton.addEventListener('click', function() {
        if(contentWindow){
            //Reset title and content window to blank
            document.getElementsByTagName('pre')[0].innerHTML = "";
            titleInput.value = "";

            //If a history button is selected, deselect it.
            var selectedButton = document.querySelector('.historyInstance.selected');
            if(selectedButton){
                document.querySelector('.historyInstance.selected')?.classList.remove('selected'); 
            }
        }
        else{
            window.location.href = '/content-generation';
        }
    })
}

if(LOButton){
    LOButton.addEventListener('click', function() {
        signOut(auth).then(() => {
            console.log('User signed out.');
            window.location.href = '/'
        }).catch((error) => {
            showToast("Signout Error", "danger", 5000);
            console.error('Signout Error', error.code, error.message);
        });
    }, false);
}

function handleSignUp(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Signup successful', userCredential.user);

            const userData = {
                email: userCredential.user.email,
                model_id: '',
                latest_training_file: '',
                job_id: '',
                created_at: serverTimestamp()
            };

            setDoc(doc(db, 'users', userCredential.user.uid), userData)
                .then(() => {
                    showToast("Signup successful!", "success", 5000);
                    console.log('User data saved successfully');
                })
                .catch(error => {
                    console.error('Error saving user data', error);
                });
        })
        .catch(error => {
            if(error.message == "Firebase: Error (auth/email-already-in-use)."){
                showToast("Signup Failed, Email already in use.", "danger", 5000); 
            } else if(error.message == "Firebase: Password should be at least 6 characters (auth/weak-password)."){
                showToast("Password too weak. Please try again.", "danger", 5000);
            }
            else{
                showToast("Signup failed", "danger", 5000);
                console.error(error.message);
            }
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
            console.log(error.message);
            if(error.message == "Firebase: Error (auth/invalid-credential)."){
                showToast("Invalid login. Please check credentials.", "danger", 5000); 
            } else{
                showToast("Sign In Failed", "danger", 5000);
            }  
        });
}

/* Toast Stuff */

let icon = { 
	success: 
	'<img src="static/images/successIcon.svg" class="toastImg"', 
	danger: 
	'<img src="static/images/dangerIcon.svg" class="toastImg"', 
	warning: 
	'<img src="static/images/warningIcon.svg" class="toastImg"', 
	info: 
	'<img src="static/images/infoIcon.svg" class="toastImg"', 
}; 

const showToast = ( message = "", toastType = "info", duration = 5000) => { 
	if (!Object.keys(icon).includes(toastType)){
        toastType = "info"; 
    }
	let box = document.createElement("div"); 
	box.classList.add("toast", `toast-${toastType}`); 
	box.innerHTML = ` <div class="toast-content-wrapper"> 
					<div class="toast-icon"> 
					${icon[toastType]} 
					</div> 
					<div class="toast-message">${message}</div> 
					<div class="toast-progress"></div> 
					</div>`; 
	duration = duration || 5000; 
	box.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`; 

	let toastAlready = document.body.querySelector(".toast"); 
	if (toastAlready) { 
		toastAlready.remove(); 
	} 
	document.body.appendChild(box)
}; 
