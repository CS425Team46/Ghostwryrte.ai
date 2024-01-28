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
                fileUpload(file);
            } else {
                alert('Only .txt files are allowed.');
            }
        }
    }

    function fileUpload(file) {
        const listItem = document.createElement('li');
        listItem.textContent = file.name;
        uploadedDocsList.appendChild(listItem);
    }
});
