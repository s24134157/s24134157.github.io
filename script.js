// script.js

// --- Global Variables ---
const MODELS_URL = '/models'; // Directory where face-api.js models are stored

let faceMatcher = null; // Will store the FaceMatcher for comparison

// --- HTML Element References ---
const dropArea1 = document.getElementById('drop-area-1');
const fileInput1 = document.getElementById('file-input-1');
const imagePreview1 = document.getElementById('image-preview-1');
const imageCanvas1 = document.getElementById('image-canvas-1');
const noFaceMessage1 = document.getElementById('no-face-message-1');
const dimensions1 = document.getElementById('dimensions-1');
const descriptorSnippet1 = document.getElementById('descriptor-snippet-1');
const fullDescriptor1 = document.getElementById('full-descriptor-1');

const dropArea2 = document.getElementById('drop-area-2');
const fileInput2 = document.getElementById('file-input-2');
const imagePreview2 = document.getElementById('image-preview-2');
const imageCanvas2 = document.getElementById('image-canvas-2');
const noFaceMessage2 = document.getElementById('no-face-message-2');
const dimensions2 = document.getElementById('dimensions-2');
const descriptorSnippet2 = document.getElementById('descriptor-snippet-2');
const fullDescriptor2 = document.getElementById('full-descriptor-2');

const comparisonResults = document.getElementById('comparison-results');
const distanceScore = document.getElementById('distance-score');
const similarityPercentage = document.getElementById('similarity-percentage');
const matchIndicator = document.getElementById('match-indicator');
const similarityIndicator = document.getElementById('similarity-indicator'); // New: Reference to the similarity indicator element

// Store face descriptors for comparison
let faceDescriptor1 = null;
let faceDescriptor2 = null;

// --- Initialize Face API and Load Models ---
async function loadModels() {
    console.log('Loading face-api.js models...');
    try {
        await faceapi.nets.tinyFaceDetector.load(MODELS_URL);
        await faceapi.nets.faceLandmark68Net.load(MODELS_URL);
        await faceapi.nets.faceRecognitionNet.load(MODELS_URL);
        await faceapi.nets.faceExpressionNet.load(MODELS_URL); // Optional: for expressions
        console.log('Models loaded successfully!');
        // document.body.classList.add('models-loaded'); // Indicate models are ready (not needed for new theme)
    } catch (error) {
        console.error('Error loading models:', error);
        alert('Failed to load face-api.js models. Please ensure the "models" folder is correctly placed and accessible.');
    }
}

// --- Event Listeners for Drag and Drop ---
function setupDropArea(dropArea, fileInput, processFunction) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    dropArea.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files, processFunction);
    }, false);

    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', e => {
        const files = e.target.files;
        handleFiles(files, processFunction);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFiles(files, processFunction) {
    if (files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => processFunction(file); // Pass the file object directly
        reader.readAsDataURL(file);
    } else {
        alert('Please upload an image file.');
    }
}

// --- Image Processing Functions ---
async function processImage1(file) {
    imagePreview1.src = URL.createObjectURL(file); // Set src for image preview
    imagePreview1.classList.remove('hidden');
    noFaceMessage1.classList.add('hidden');
    clearCanvas(imageCanvas1);
    clearFaceData(1);

    const img = await faceapi.bufferToImage(file);
    await detectAndDraw(img, imageCanvas1, 1);
    updateComparison();
    URL.revokeObjectURL(imagePreview1.src); // Revoke object URL after use
}

async function processImage2(file) {
    imagePreview2.src = URL.createObjectURL(file); // Set src for image preview
    imagePreview2.classList.remove('hidden');
    noFaceMessage2.classList.add('hidden');
    clearCanvas(imageCanvas2);
    clearFaceData(2);

    const img = await faceapi.bufferToImage(file);
    await detectAndDraw(img, imageCanvas2, 2);
    updateComparison();
    URL.revokeObjectURL(imagePreview2.src); // Revoke object URL after use
}

async function detectAndDraw(img, canvas, imageNumber) {
    // Set canvas dimensions to match image
    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(canvas, displaySize);

    // Detect faces and get full face descriptions (landmarks + descriptors)
    const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
        (imageNumber === 1 ? noFaceMessage1 : noFaceMessage2).classList.remove('hidden');
        if (imageNumber === 1) faceDescriptor1 = null;
        else faceDescriptor2 = null;
        updateComparison();
        return;
    }

    // Resize results to fit canvas
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Draw detections (bounding box and landmarks)
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    canvas.classList.remove('hidden');
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    // Display face data
    displayFaceData(detections, imageNumber);
}

function displayFaceData(detection, imageNumber) {
    const descriptor = detection.descriptor;
    const dimensionsSpan = (imageNumber === 1 ? dimensions1 : dimensions2);
    const snippetSpan = (imageNumber === 1 ? descriptorSnippet1 : descriptorSnippet2);
    const fullTextArea = (imageNumber === 1 ? fullDescriptor1 : fullDescriptor2);

    dimensionsSpan.textContent = descriptor.length;
    snippetSpan.textContent = Array.from(descriptor).slice(0, 20).map(d => d.toFixed(4)).join(', ');
    fullTextArea.value = JSON.stringify(Array.from(descriptor), null, 2);

    if (imageNumber === 1) faceDescriptor1 = descriptor;
    else faceDescriptor2 = descriptor;
}

function clearFaceData(imageNumber) {
    const dimensionsSpan = (imageNumber === 1 ? dimensions1 : dimensions2);
    const snippetSpan = (imageNumber === 1 ? descriptorSnippet1 : descriptorSnippet2);
    const fullTextArea = (imageNumber === 1 ? fullDescriptor1 : fullDescriptor2);

    dimensionsSpan.textContent = '';
    snippetSpan.textContent = '';
    fullTextArea.value = '';

    if (imageNumber === 1) faceDescriptor1 = null;
    else faceDescriptor2 = null;
}

function clearCanvas(canvas) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.add('hidden');
}

// --- Face Comparison Logic ---
function updateComparison() {
    // Select the icon elements
    const questionIcon = similarityIndicator.querySelector('.fa-question-circle');
    let checkIcon = similarityIndicator.querySelector('.fa-check-circle');
    const indicatorTextSpan = similarityIndicator.querySelector('.indicator-text');

    // Ensure checkIcon exists, create if not (it's added in HTML now)
    if (!checkIcon) {
        checkIcon = document.createElement('i');
        checkIcon.classList.add('fas', 'fa-check-circle', 'icon-sketch', 'hidden');
        similarityIndicator.insertBefore(checkIcon, indicatorTextSpan);
    }

    // Reset indicator state
    similarityIndicator.classList.remove('match', 'no-match');
    questionIcon.classList.remove('hidden');
    checkIcon.classList.add('hidden');
    indicatorTextSpan.textContent = 'Waiting for comparison...'; // Default text

    if (faceDescriptor1 && faceDescriptor2) {
        const distance = faceapi.euclideanDistance(faceDescriptor1, faceDescriptor2);
        const similarity = (1 - distance).toFixed(2); // Similarity score (0 to 1)

        distanceScore.textContent = distance.toFixed(4);
        similarityPercentage.textContent = `${(similarity * 100).toFixed(2)}%`;

        const isMatch = distance < 0.6; // Adjust threshold as needed

        matchIndicator.textContent = isMatch ? 'Match!' : 'No Match'; // For the text within comparison-results
        matchIndicator.className = '';
        matchIndicator.classList.add(isMatch ? 'match' : 'no-match');

        // Update similarityIndicator (the badge)
        if (isMatch) {
            similarityIndicator.classList.add('match');
            indicatorTextSpan.textContent = 'Match Found!';
            questionIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');
        } else {
            similarityIndicator.classList.add('no-match');
            indicatorTextSpan.textContent = 'No Match';
            questionIcon.classList.remove('hidden'); // Keep question mark if no match
            checkIcon.classList.add('hidden');
        }

        comparisonResults.classList.remove('hidden'); // Show comparison results section
    } else {
        // If one or both descriptors are missing, hide comparison results
        comparisonResults.classList.add('hidden');
    }
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    setupDropArea(dropArea1, fileInput1, processImage1);
    setupDropArea(dropArea2, fileInput2, processImage2);
});
