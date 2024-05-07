import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, query, orderBy, doc, setDoc, serverTimestamp, getDocs, getDoc, deleteDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification  } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import jsPDF from 'https://cdn.skypack.dev/jspdf';


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

var stripe = Stripe('pk_test_51P2luTK9QOcf8ycFt3tqWFxAlpyYGv4EcAM8JOfDlV0cqJgdStCGejJ3sSAz7HxRGJS0OOM7B69gPeIKkQDFPjkv00bY9amb8J'); // publishable key

/* AI Training Page */
const fileUploadWindow      = document.querySelector('.innerUploadWrapper');
const uploadedDocsList      = document.querySelector('.uploadedFiles');
const closePopUpWindow      = document.getElementById('closePopUp');
/* Account Creation Page */
const accCreationPageCheck  = document.getElementById('accPage');
const logOutButton          = document.getElementById('LOButton');
const forgotPass            = document.getElementById('forgotPass');
var ACUserOption            = 1; // 1 = Sign In & 2 = Sign Up
/*Password Reset Page */
const passResetPage         = document.getElementById('passResetPage');
const resetPassInputBox     = document.getElementById('resetPassword');
const submitPassReset       = document.getElementById('submitPassReset');
/* Content Generation Page */
const genButtonID           = document.getElementById('genButtonID');
const historyInstance       = document.createElement('div');
const contentWindow         = document.querySelector('.contentGenWindow');
const copyButton            = document.querySelector('.copyButton');
const titleInput            = document.querySelector('.titleText');
let newChatButton           = document.getElementById('newChat');
let historyContentWindow    = document.querySelector('.historyContentWindow');
let feedbackDisplay         = document.getElementById('feedbackDisplay');
/* Generation History Page */
const historyPageLabel      = document.getElementById('historyPageLabel');
const historyPageContainer  = document.getElementById('historyPageContainer');
const historyPageTitleText  = document.getElementById('historyPageTitleText');
const instanceView          = document.getElementById('instanceView');
const editView              = document.getElementById('editView');
const editTextArea          = document.getElementById('editTextArea');
const saveButton            = document.getElementById('saveButton');
const copyButtonEditPage    = document.getElementById('copyButtonEditPage');
const downloadButton        = document.getElementById('downloadButton');
const histGenBack           = document.getElementById('histGenBack');
/* Landing Page */
const landingPageCheck      = document.getElementById('landingCheck');
const landingLoginButton    = document.getElementById('landingLogin');

auth.onAuthStateChanged((user) => {
    if (user) {
        const userIdField = document.getElementById('formUserId');
        if (userIdField) {
            userIdField.value = user.uid;
        }
        if (contentWindow){
            callHistoryUploadAfterGeneration();
            loadHistoryButtons();
            checkForContentAndUpdateStyling();
            hideHistoryID();
        }
        if(historyPageLabel){
            loadHistoryButtons();
        }
    } else {
        if(!accCreationPageCheck && !passResetPage && !landingPageCheck){
            window.location.href = '/accountCreation';
        }   
    }
});

/* Content Generation Page */
if(landingPageCheck){
    landingLoginButton.addEventListener('click', function(){
        window.location.href = '/accountCreation';
    });
}
if (contentWindow) {

    copyButton.addEventListener('click', (event) => {
        event.preventDefault();

        var content = document.querySelector('pre'); 
        copyText(content);
        checkmarkImageChangeConfirm('copyImg');
    });

    // Turns on and off the submit prompt button
    document.querySelector('.queryBox').addEventListener('input', handlePromptChange);

    function handlePromptChange() {
        checkForContentAndUpdateStyling(); 
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
            titleInput.blur();
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

    document.getElementById('likeBtn').addEventListener('click', function(){
        handleFeedback("Positive Feedback");
    });
    document.getElementById('dislikeBtn').addEventListener('click', function(){
        handleFeedback("Negative Feedback");
    });
    
    async function handleFeedback(feedbackType){

        const user = auth.currentUser;

        if (user) {
            const newTitle = feedbackType + " on document: " + titleInput.value.trim();
            await setDoc(doc(db, 'users', user.uid, 'feedback', newTitle), {
                feedbackType: feedbackType,
                title: titleInput.value.trim(),
                content: document.getElementsByTagName('pre')[0].innerHTML,
            });
            showToast("Feedback Submitted!", "success", 5000);
            toggleFeedbackDisplay("off");
        } else {
            console.error('No user is signed in to update history');
        }
    }


}

function hideHistoryID(){
    if(!historyContentWindow.firstChild) {
        document.getElementById('hID').style.display = 'none';
    }
}

function toggleFeedbackDisplay(turnOnorOff){
    if(turnOnorOff == "on"){
        feedbackDisplay.style.display = 'flex';
    } else{
        feedbackDisplay.style.display = 'none';
    }
}

function copyText(textSelectionID){
        
    var range = document.createRange();
    range.selectNode(textSelectionID);

    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();

}

function checkmarkImageChangeConfirm(imageID){
    var img = document.getElementById(imageID);
    img.setAttribute('src', "./static/images/checkmark.svg");
    
    setTimeout(() => {
        img.setAttribute('src', "./static/images/clipboard.png");
    }, 1000); 
}

function checkForContentAndUpdateStyling() {
    if (contentWindow) {
        var generatedContent = document.getElementsByTagName('pre')[0].innerHTML;
        var promptContent = document.querySelector('.queryBox').value.trim(); 

        toggleCopyButtonByElementExistence(generatedContent);
        enablePromptSubmitIfTextExists(promptContent);
    }
}

function toggleCopyButtonByElementExistence(element){
    if(element) {
        copyButton.style.visibility = 'visible';
        copyButton.style.pointerEvents = 'all';
    } else {
        copyButton.style.visibility = 'hidden';
        copyButton.style.pointerEvents = 'none';
    }
}

function enablePromptSubmitIfTextExists(text){
    if(text) { 
        genButtonID.style.pointerEvents = 'all';
        genButtonID.style.background = "var(--mainAccentColor)";
        genButtonID.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.4)";
    } else {
        genButtonID.style.pointerEvents = 'none';
        genButtonID.style.background = "var(--secondaryColor)";
        genButtonID.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
    }  
}

/* Functionality to upload newly generated prompt to user history */
function callHistoryUploadAfterGeneration() {
    if(contentWindow){
        var content = document.getElementsByTagName('pre')[0].innerHTML;
        
        if(content){
            const newContent = content;
            const title = extractTitle(content);
            const timestamp = new Date().getTime();
            const seconds = Math.floor(timestamp / 1000); 
            const nanoseconds = (timestamp % 1000) * 1000000;

            const historyData = localStorage.getItem('historyData');
            let existingData = historyData ? JSON.parse(historyData) : [];

            existingData.unshift({ title, content, timestamp: { seconds, nanoseconds } });

            titleInput.value = title; 
            toggleFeedbackDisplay("on");

            uploadHistory(title, newContent)
                .then(() => {
                    localStorage.setItem('historyData', JSON.stringify(existingData));
                    loadHistoryButtons();
                })
                .catch(error => {
                    showToast("Failed to upload history data: " + error.message, "danger", 5000);
                    console.error('Failed to upload history data:', error);
                });
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
    const historyData = localStorage.getItem('historyData');
    if (historyData) {

        if(historyContentWindow){       
            renderRecentHistoryButtons(JSON.parse(historyData));
        }  
        else if (historyPageLabel) {
            renderGenerationHistoryButtons(JSON.parse(historyData));
        }

    } else {
        const user = auth.currentUser;
        if (user) {
            const historyRef = collection(db, `users/${user.uid}/history`);
            const q = query(historyRef, orderBy('time', 'desc'));
            const querySnapshot = await getDocs(q);

            const historyButtonsData = [];

            querySnapshot.forEach(doc => {
                const title = doc.data().title;
                const content = doc.data().content;
                const timestamp = doc.data().time;
                historyButtonsData.push({ title, content, timestamp });
            });

            
            localStorage.setItem('historyData', JSON.stringify(historyButtonsData));

            if(historyContentWindow){
                renderRecentHistoryButtons(historyButtonsData);
            }  
            else if (historyPageLabel) {
                renderGenerationHistoryButtons(historyButtonsData);
            }
        } else {
            showToast("No user is signed in to load history", "danger", 5000);
            console.error('No user is signed in to load history');
        }
    }
}

function renderRecentHistoryButtons(historyButtonsData) {
    while (historyContentWindow.firstChild) {
        historyContentWindow.removeChild(historyContentWindow.firstChild);
    }

    historyButtonsData.slice(0, 10).forEach(data => {
        const { title, content } = data;
        createHistoryButtonCG(title, content);
    });

    if(!historyButtonsData == ""){
        document.getElementById('hID').style.display = 'flex';
        document.getElementById('hID').classList.add("fadeInClass");
    }
}

function renderGenerationHistoryButtons(historyButtonsData) {
    while (historyPageContainer.firstChild) {
        historyPageContainer.removeChild(historyPageContainer.firstChild);
    }
    historyButtonsData.forEach(data => {
        const { title, content, timestamp } = data;
        const firestoreTimestamp = new Timestamp(timestamp.seconds, timestamp.nanoseconds);
        createHistoryButtonGH(title, content, firestoreTimestamp);
    });
}

function createHistoryButtonGH(title, content, timestamp) {
    const historyPageInstance = document.createElement('div');
    historyPageInstance.classList.add('historyPageInstance');

    const columnWrapper = document.createElement('div');
    columnWrapper.classList.add('columnWrapper');

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('historyPageInstanceTitle');
    titleSpan.textContent = title;

    columnWrapper.appendChild(titleSpan);

    const historyInfoContainer = document.createElement('div');
    historyInfoContainer.classList.add('historyInfoContainer');

    const dateSpan = document.createElement('span');
    dateSpan.classList.add('historyPageInstanceInfo');

    const dateText = document.createTextNode(new Date(timestamp.toDate()).toLocaleDateString());
    dateSpan.appendChild(dateText);
    historyInfoContainer.appendChild(dateSpan);

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('historyPageInstanceInfo');


    const timeText = document.createTextNode(new Date(timestamp.toDate()).toLocaleTimeString());
    timeSpan.appendChild(timeText);
    historyInfoContainer.appendChild(timeSpan);

    columnWrapper.appendChild(historyInfoContainer);

    historyPageInstance.appendChild(columnWrapper);

    const deleteHistoryInstance = document.createElement('div');
    deleteHistoryInstance.classList.add('deleteHistoryInstance');
    const deleteHistoryInstanceImg = document.createElement('img');
    deleteHistoryInstanceImg.src = "static/images/trashcanIcon.svg";
    deleteHistoryInstanceImg.alt = "Delete Content";
    deleteHistoryInstanceImg.classList.add('deleteHistoryInstanceImg');
    deleteHistoryInstance.appendChild(deleteHistoryInstanceImg);

    historyPageInstance.appendChild(deleteHistoryInstance);
    historyPageInstance.classList.add('fadeInClass');
    historyPageContainer.appendChild(historyPageInstance);

    deleteHistoryInstance.addEventListener('click', (event) => {
        event.stopPropagation();
        const historyPageInstanceToDelete = historyPageInstance;
        deleteHistoryInstanceFunc(historyPageInstanceToDelete);
    });

    historyPageInstance.addEventListener('click', () => {
        instanceView.style.display = 'none';
        editView.style.display = 'flex';
        histGenBack.style.display = 'flex';
        document.querySelector('.logOutWrapper').classList.add('genHist');
        
        const title = historyPageInstance.querySelector('.historyPageInstanceTitle').textContent;
        historyPageTitleText.value = title; 
        
        document.querySelector('.historyPageInstance.selected')?.classList.remove('selected');
        historyPageInstance.classList.add('selected');
        editTextArea.value = content;
        localStorage.setItem('openedText', content);
        localStorage.setItem('openedTitle', title);
    });
}

async function deleteHistoryInstanceFunc(historyPageInstanceToDelete) {
    const title = historyPageInstanceToDelete.querySelector('.historyPageInstanceTitle').textContent;
    console.log(title);

    const user = auth.currentUser;
    if (user) {
        const oldHistoryRef = doc(db, 'users', user.uid, 'history', title);
        console.log(oldHistoryRef);
        await deleteDoc(oldHistoryRef);
    } else {
        console.error('No user is signed in to delete history');
    }
    historyPageInstanceToDelete.remove();
    removeFromLocalStorageByTitle(title);

}

function removeFromLocalStorageByTitle(title) {
    const historyData = JSON.parse(localStorage.getItem('historyData'));
    const index = historyData.findIndex(item => item.title === title);

    if (index !== -1) {
        historyData.splice(index, 1);
        localStorage.setItem('historyData', JSON.stringify(historyData));
    } else {
        console.error('Item not found in local storage');
    }
}

function createHistoryButtonCG(title, content) {

    const historyButton = document.createElement('button');
    const buttonText = document.createElement('span');

    buttonText.textContent = title;
    buttonText.classList.add('innerHistorySpan');
    historyButton.appendChild(buttonText);
    historyButton.classList.add('historyInstance');
    historyButton.classList.add('fadeInClass');

    historyButton.addEventListener('click', () => {
        titleInput.value = buttonText.textContent; 
        document.querySelector('.historyInstance.selected')?.classList.remove('selected'); 
        historyButton.classList.add('selected'); 
        document.getElementsByTagName('pre')[0].innerHTML = content;
        checkForContentAndUpdateStyling();
        toggleFeedbackDisplay("off");
    });

    historyContentWindow.appendChild(historyButton);
}

/* Edit Page of Generation History */

if (saveButton) {

    deactivateSaveButton();

    editTextArea.addEventListener('input', function(){
        checkIfEditsWereMade();
    });
    historyPageTitleText.addEventListener('input', function(){
        checkIfEditsWereMade();
    });

    function checkIfEditsWereMade(){
        if ( (editTextArea.value === localStorage.getItem('openedText')) && (historyPageTitleText.value === localStorage.getItem('openedTitle'))){
            deactivateSaveButton();
        } else{
            saveButton.style.pointerEvents = '';
            saveButton.style.background = ''
        }
    }

    saveButton.addEventListener('click', function() {
        const oldTitle = document.querySelector('.historyPageInstance.selected .historyPageInstanceTitle').textContent;
        const newTitle = document.getElementById('historyPageTitleText').value.trim();
        const newContent = document.getElementById('editTextArea').value.trim();

        updateLocalStorage(oldTitle, newTitle, newContent);
        updateEditedHistoryFirebase(oldTitle, newTitle, newContent);

        var img = saveButton.querySelector('.editButtonImg');
        img.style.height = '100%'
        img.setAttribute('src', "./static/images/checkmark.svg");
        setTimeout(() => {
            img.style.maxHeight = '80%'
            img.setAttribute('src', "./static/images/saveIcon.svg");
        }, 1000);
        document.querySelector('.historyPageInstance.selected .historyPageInstanceTitle').textContent = newTitle;
    });

    copyButtonEditPage.addEventListener('click', (event) => {
        event.preventDefault();

        copyText(editTextArea);
    
        document.getElementById('copyBtnImg').style.height = '100%';
        checkmarkImageChangeConfirm('copyBtnImg');
        document.getElementById('copyBtnImg').style.maxHeight = '80%'
    });

    downloadButton.addEventListener('click', function() {

        var pdf = new jsPDF();
        var textareaContent = document.getElementById('editTextArea').value;

        var margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("times", "regular");
        
        var availableWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;
        var textLines = pdf.splitTextToSize(textareaContent, availableWidth);
        
        pdf.text(textLines, margin.left, margin.top);
        pdf.save('Ghostwryte_Content.pdf');
        
    });


}
function deactivateSaveButton(){
    saveButton.style.background = "var(--deselectedColor)";
    saveButton.style.pointerEvents = 'none';
}
function updateLocalStorage(oldTitle, newTitle, newContent) {

    const historyData = JSON.parse(localStorage.getItem('historyData'));
    const index = historyData.findIndex(item => item.title === oldTitle);

    if (index !== -1) {
        historyData[index].title = newTitle;
        historyData[index].content = newContent;

        localStorage.setItem('historyData', JSON.stringify(historyData));
    } else {
        console.error('Item not found in history data');
    }
}

async function updateEditedHistoryFirebase(oldTitle, newTitle, newContent) {
    const user = auth.currentUser;
    if (user) {
        const oldHistoryRef = doc(db, 'users', user.uid, 'history', oldTitle);

            const oldHistoryDoc = await getDoc(oldHistoryRef);
            
            if (oldHistoryDoc.exists()) { 
                const oldHistoryData = oldHistoryDoc.data();           

                await deleteDoc(oldHistoryRef);
                await setDoc(doc(db, 'users', user.uid, 'history', newTitle), {
                    title: newTitle,
                    content: newContent,
                    time: new Date()
                });

             } else {
                console.error('Document does not exist:', oldTitle);
            } 
    } else {
        console.error('No user is signed in to update history');
    }
}

if(instanceView){
    histGenBack.addEventListener('click', () => {
        instanceView.style.display = 'flex';
        editView.style.display = 'none';
        histGenBack.style.display = 'none';
        document.querySelector('.logOutWrapper').classList.remove('genHist');
        localStorage.removeItem('openedText');
        localStorage.removeItem('openedTitle');
        deactivateSaveButton();
        loadHistoryButtons();
    });
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

    closePopUpWindow.addEventListener('click', function(){
        document.getElementById('popUpWindowContainer').style.display = 'none';
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
    let titleSentence = sentences[0].trim();
    titleSentence = titleSentence.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
    return titleSentence;
}

function fileUpload(title, fileContent) {

    const uploadedFileInstance = createUploadedFileInstance(title);
    const deleteButton = createDeleteButtonOnUploadedFileInstance();

    uploadedFileInstance.appendChild(deleteButton);
    uploadedDocsList.appendChild(uploadedFileInstance);
    uploadedFileInstance.setAttribute('fileContent', fileContent);

    deleteButton.addEventListener('click', function() {
        uploadedDocsList.removeChild(uploadedFileInstance);
    });
}

function createUploadedFileInstance(title){
    const uploadedFileInstance = document.createElement('div');
    uploadedFileInstance.classList.add('uploadedFileInstance');

    const img = document.createElement('img');
    img.setAttribute('src', "./static/images/textFile.svg");
    img.classList.add('fileInstanceImgTxt');
    uploadedFileInstance.appendChild(img);

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = title;
    fileNameSpan.classList.add('fileName');
    uploadedFileInstance.appendChild(fileNameSpan);

    return uploadedFileInstance;
}

function createDeleteButtonOnUploadedFileInstance(){
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('deleteFileButton');

    const deleteImg = document.createElement('img');
    deleteImg.setAttribute('src', "./static/images/blackX.svg");
    deleteImg.classList.add('fileInstanceImgX');
    deleteButton.appendChild(deleteImg);

    return deleteButton;
}

function generateSessionId() {
    return new Date().getTime().toString();  // Convert time to string to use as a session ID
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
            const title = extractTitle(fileContent); 

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
        // Show the popUpWindowContainer immediately when the button is clicked
        document.getElementById('popUpWindowContainer').style.display = 'flex';

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
            .then(response => response.json()) // Move the response.json() up here
            .then(data => {
                console.log(data.message);
                // Conditionally hide the popUpWindowContainer based on the response
                if(data.message === "Model training script failed"){
                    showToast(data.message, "danger", 5000);
                    document.getElementById('popUpWindowContainer').style.display = 'none';
                } 
                else {
                    showToast(data.message, "success", 5000);
                }
            })
            .catch(error => {
                console.error('Error starting model training:', error);
                showToast("Error starting model training", "danger", 5000);
                // Make sure to hide the popup in case of fetch error as well
                document.getElementById('popUpWindowContainer').style.display = 'none';
            });
        } else {
            console.log("No user signed in");
            showToast("Please sign in to start model training", "danger", 5000);
            // Hide the popUpWindowContainer if no user is signed in
            document.getElementById('popUpWindowContainer').style.display = 'none';
        }
    });
}



/* Account Creation Page */

if (accCreationPageCheck) {
    const signInButton = document.getElementById('signInBtn');
    const signUpButton = document.getElementById('signUpBtn');
    const ACSubmit = document.getElementById('ACSubmit');
    var confirmPass = document.getElementById('confirmPassword');
    var confirmPassText = document.getElementById('confText');
    

    document.getElementById('userSubmitForm').addEventListener('submit', function (event) {
        event.preventDefault(); 

        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        setConfirmPassValidityMessage("", false);

        if (ACUserOption == 1) {
            handleSignIn(email, password);
        } 
        else {
            if (confirmPass.value != password) {
                setConfirmPassValidityMessage("Passwords don't match", true);
                return;
            } else {
                handleSignUp(email, password);
                return;
            }
        }
    });

    confirmPass.addEventListener('input', function() {
        setConfirmPassValidityMessage("", true);
    });

    signInButton.addEventListener('click', function () {

        ACUserOption = 1;
        ACSubmit.classList.remove('removed');
        forgotPass.classList.remove('removed');

        toggleOnSignInStyling();

        setConfirmPassValidityMessage("", false);
        confirmPass.classList.remove('active');
        confirmPass.value = "";
        confirmPassText.classList.remove('active');   
        ACSubmit.textContent = "Log In";
    });
    
    signUpButton.addEventListener('click', function () {

        ACUserOption = 2;
        ACSubmit.classList.add('removed');
        forgotPass.classList.add('removed');

        toggleOnSignUpStyling();

        confirmPass.classList.add('active');
        confirmPassText.classList.add('active');
        
        ACSubmit.textContent = "Sign Up";
    });

    forgotPass.addEventListener('click', function (){
        window.location.href = '/password-reset';
    });

    function toggleOnSignInStyling(){
        signInButton.style.color = 'var(--textColor)';
        signInButton.style.borderBottom = '5px solid var(--textColor)';
        signUpButton.style.color = 'var(--deselectedColor)';
        signUpButton.style.borderBottom = '5px solid var(--deselectedColor)';
    }
    function toggleOnSignUpStyling(){
        signUpButton.style.color = 'var(--textColor)';
        signUpButton.style.borderBottom = '5px solid var(--textColor)';
        signInButton.style.color = 'var(--deselectedColor)';
        signInButton.style.borderBottom = '5px solid var(--deselectedColor)';
    }

    function setConfirmPassValidityMessage(string, reportValidityOrNot){
        confirmPass.setCustomValidity(string);
        if(reportValidityOrNot){
            confirmPass.reportValidity();
        }
    }

    function handleSignUp(email, password) {

        if (!checkIfPasswordMeetsRequirements(password)) {
            showToast("Password must meet the following requirements:<br>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;- At least 8 characters long<br>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;- Contains at least one uppercase letter<br>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;- Contains at least one lowercase letter<br>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;- Contains at least one number<br>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;- Contains at least one special character", "danger", 10000);
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                console.log('Signup successful', userCredential.user);

               sendEmailVerification(auth.currentUser)
                .then(() => {
                    showToast("Please check your email for verification.", "success", 5000);
                })
                .catch(error => {
                    showToast("Error sending verification email: " + error, "danger", 5000);
                });

                const userData = {
                    email: userCredential.user.email,
                    model_id: '',
                    latest_training_file: '',
                    job_id: '',
                    created_at: serverTimestamp()
                };

                setDoc(doc(db, 'users', userCredential.user.uid), userData)
                    .then(() => {
                       console.log('User data saved successfully');
                    })
                    .catch(error => {
                        console.error('Error saving user data', error);
                })   
            })
            .catch(error => {
                if(error.message == "Firebase: Error (auth/email-already-in-use)."){
                    showToast("Signup Failed, Email already in use.", "danger", 5000); 
                } 
                else{
                    showToast("Signup failed", "danger", 5000);
                    console.error(error.message);
                }
            });
    }

    function checkIfPasswordMeetsRequirements(password){
        const minLength = 6;
        const containsNumber = /\d/.test(password);
        const containsSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
        const containsUppercase = /[A-Z]/.test(password);
        const containsLowercase = /[a-z]/.test(password);

        const doesPassMeetReqs = minLength && containsNumber && containsSpecialChar && containsUppercase && containsLowercase;
        return doesPassMeetReqs;
    }

    function handleSignIn() {
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                /* REMVOE THIS PART LATER */
                if(email == "test@test.com" || email =="testing220@test.com" || email == "12@test.com"){
                    console.log('Signin successful', userCredential.user);
                    window.location.href = '/content-generation';
                }
                if(userCredential.user.emailVerified){
                    console.log('Signin successful', userCredential.user);
                    window.location.href = '/content-generation';
                } else{
                    showToast('Email has not been verified.', "danger", 5000);
                }

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

}
if (passResetPage){
    submitPassReset.addEventListener('click', function(){
        const email = resetPassInputBox.value;
        sendPasswordResetEmail(auth, email)
        .then(() => {
            showToast("Password reset email sent!", "success", 5000);
        })
        .catch((error) => {
            showToast("Password reset email failed.", "danger", 5000);
            const errorMessage = error.message;
        });
    });
}

/* If NOT on the Account Creation Page */
if (!accCreationPageCheck && !passResetPage && !landingPageCheck){

    newChatButton.addEventListener('click', function() {
        if(contentWindow){
            clearTextAndTitle();

            var selectedButton = document.querySelector('.historyInstance.selected');
            if(selectedButton){
                document.querySelector('.historyInstance.selected')?.classList.remove('selected'); 
            }
            checkForContentAndUpdateStyling();
        }
        else{
            window.location.href = '/content-generation';
        }
    })

    function clearTextAndTitle(){
        document.getElementsByTagName('pre')[0].innerHTML = "";
        titleInput.value = "";
    }

    if(document.URL.includes('ai-training')){
        document.getElementById('aiTrain').style="background: var(--mainColor); box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);";
    }
    if(document.URL.includes('content-generation')){
        document.getElementById('contGen').style="background: var(--mainColor); box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);";
    }
    if(document.URL.includes('generation-history')){
        document.getElementById('historyTab').style="background: var(--mainColor); box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);";
    }

    document.getElementById('subscribe-button').addEventListener('click', function() {
        fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(function(response) {
            if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
            return response.json();
        })
        .then(function(session) {
            return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
    });
}

if(logOutButton){
    logOutButton.addEventListener('click', function() {
        signOut(auth).then(() => {
            localStorage.clear();
            window.location.href = '/accountCreation'
        }).catch((error) => {
            showToast("Signout Error", "danger", 5000);
            console.error('Signout Error', error.code, error.message);
        });
    }, false);
}

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

const showToast = (message = "", toastType = "info", duration) => {
    if (!Object.keys(icon).includes(toastType)) {
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
    box.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`;

    box.style.animationDelay = `0s, ${duration / 1000}s`;

    let toastAlready = document.body.querySelector(".toast");
    if (toastAlready) {
        toastAlready.remove();
    }
    document.body.appendChild(box);
};




