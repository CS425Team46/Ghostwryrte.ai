import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'

document.addEventListener('DOMContentLoaded', () => {
    const fileUploadWindow = document.querySelector('.fileUploadWindow');
    const uploadedDocsList = document.querySelector('.uploadedDocs');

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

    function uploadToFirebase(title, fileContent) {

        window.alert(1)
        const firebaseConfig = {
          apiKey: "AIzaSyDW-idC8yzOs7HlFZ21sB5-H7UjRZ6N6hs",
          authDomain: "ghostwryte-ai.firebaseapp.com",
          projectId: "ghostwryte-ai",
          storageBucket: "ghostwryte-ai.appspot.com",
          messagingSenderId: "837044282202",
          appId: "1:837044282202:web:e5bc8ac9a865b8ee2cc963",
          measurementId: "G-MD1XND7LM3"
        };

        firebase.initializeApp(firebaseConfig);

        const db = firebase.database();

        db.collection("DataSamples").add({
            Title: title,
            Content: fileContent
        }).then(() => {
            console.log('Data successfully uploaded to Firebase.');
        }).catch((error) => {
            console.error('Error uploading data to Firebase:', error);
        });

    }
});
