const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const images = [];
const layersVisible = [false, false]; // Only Layer 1 is visible by default
const imageSources = [
    // skull 
    'nerve_images/skull_.png', 
    'nerve_images/Skull Labels_.png', 
    'nerve_images/PTF_.png',
    'nerve_images/Facial Nerve_.png',
    'nerve_images/Facial nerve labels_.png',
    'nerve_images/Cutaneous facial_.png',
    'nerve_images/Cutaneous facial nerve labels_.png',
    'nerve_images/Trigeminal Nerve_.png',
    'nerve_images/Vagus_.png',
    'nerve_images/Vagus nerve labels_.png',
    'nerve_images/Glossopharyngeal_.png', 
    'nerve_images/Glossopharyngeal labels_.png',
    'nerve_images/Oculomotor _.png',
    'nerve_images/Mandibular nerve_.png',
    'nerve_images/Mandibular nerve labels_.png',
    'nerve_images/Maxillary_.png', 
    'nerve_images/Maxillary nerve labels_.png',
    'nerve_images/Ophthalmic_.png',
    'nerve_images/Ophthalmic labels_.png',

    'facial_muscle_images/Skull.png',// 19
    'facial_muscle_images/Thyroid  cartilage.png',
    'facial_muscle_images/corrugator supercilii.png',
    'facial_muscle_images/orbicularis oculi.png',
    'facial_muscle_images/frontalis.png',
    'facial_muscle_images/Procerus.png',
    'facial_muscle_images/levator Anguli oris.png',
    'facial_muscle_images/Levator labii superioris.png',
    'facial_muscle_images/Levator labii superioris alaeque nasi.png',
    'facial_muscle_images/Mentalis.png',
    'facial_muscle_images/Orbicularis oris.png',
    'facial_muscle_images/Buccinator.png',
    'facial_muscle_images/Zygomaticus minor.png',
    'facial_muscle_images/zygomaticus major.png',
    'facial_muscle_images/Nasalis .png',
    'facial_muscle_images/Risorius.png',
    'facial_muscle_images/Depressor Labii inferioris.png',
    'facial_muscle_images/Depressor anguli oris.png',
    'facial_muscle_images/Thyrohyoid muscle.png',
    'facial_muscle_images/Sternothyroid .png',
    'facial_muscle_images/Sternohyoid.png',
    'facial_muscle_images/Omohyoid.png',
    'facial_muscle_images/Platysma.png'
    //42
]; 

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
