const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const images = [];
const layersVisible = [true, false, false]; // Only Layer 1 is visible by default
const imageSources = [
    'images/skull_.png', 
    'images/Skull Labels_.png', 
    'images/PTF_.png',
    'images/Facial Nerve_.png',
    'images/Facial nerve labels_.png',
    'images/Cutaneous facial_.png',
    'images/Cutaneous facial nerve labels_.png',
    'images/Trigeminal Nerve_.png',
    'images/Vagus_.png',
    'images/Vagus nerve labels_.png',
    'images/Glossopharyngeal_.png', 
    'images/Glossopharyngeal labels_.png',
    'images/Oculomotor _.png',
    'images/Mandibular nerve_.png',
    'images/Mandibular nerve labels_.png',
    'images/Maxillary_.png', 
    'images/Maxillary nerve labels_.png',
    'images/Ophthalmic_.png',
    'images/Ophthalmic labels_.png'
]; // Add your image paths here

let scale = 1;
let originX = 0;
let originY = 0;
let isDragging = false;
let lastX;
let lastY;

canvas.width = window.innerWidth * 0.8; // Set canvas width
canvas.height = window.innerHeight * 0.8; // Set canvas height

// Load images
function loadImages() {
    imageSources.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            images[index] = img;
            if (index === 0) {
                // Set initial scale to fit the first image vertically
                scale = canvas.height / img.height;
                originX = (canvas.width - img.width * scale) / 2; // Center the image horizontally
            }
            draw();
        };
    });
}

// Draw the images on the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    images.forEach((img, index) => {
        if (layersVisible[index]) {
            ctx.drawImage(img, originX, originY, img.width * scale, img.height * scale);
        }
    });
}

// Toggle layer visibility
function toggleLayer(index, isChecked) {
    layersVisible[index] = isChecked;
    draw();
}

// Zoom in and out with mouse wheel
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale += e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(scale, 0.1); // Prevent scaling below 10%
    draw();
});

// Mouse down, up, and move for dragging
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
    canvas.style.cursor = 'grabbing'; // Change cursor
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab'; // Reset cursor
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.offsetX - lastX;
        const dy = e.offsetY - lastY;
        originX += dx;
        originY += dy;
        lastX = e.offsetX;
        lastY = e.offsetY;
        draw();
    }
});

// Load images when the page is ready
window.onload = loadImages;
