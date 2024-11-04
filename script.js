const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const images = [];
let scale = 1;
let originX = 0;
let originY = 0;
let isDragging = false;
let lastX;
let lastY;


canvas.width = window.innerWidth * 0.8; // Set canvas width
canvas.height = window.innerHeight * 0.8; // Set canvas height


const nervesSources = [
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
    'nerve_images/Ophthalmic labels_.png'
];

const musclesSources = [
    'facial_muscle_images/Skull.png', //0
    'facial_muscle_images/Thyroid  cartilage.png', //1
    'facial_muscle_images/corrugator supercilii.png', //2
    'facial_muscle_images/orbicularis oculi.png', // 3
    'facial_muscle_images/frontalis.png', // 4
    'facial_muscle_images/Procerus.png', // 5
    'facial_muscle_images/levator Anguli oris.png', // 6
    'facial_muscle_images/Levator labii superioris.png', // 7
    'facial_muscle_images/Levator labii superioris alaeque nasi.png', //8 
    
    'facial_muscle_images/Platysma.png', // 9
    'facial_muscle_images/Mentalis.png', // 10
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
];

const arterySources = [
    'arteries_images/Subclavian_and_branches.png', 
    'arteries_images/Bones.png',
    'arteries_images/Common_Carotid.png',
    'arteries_images/Ext_carotid_and_branches.png',
    'arteries_images/Superior_Thyroid.png',
    'arteries_images/Lingual_Artery.png',
    'arteries_images/Facial_Artery.png',
    'arteries_images/superficial_temporal.png',
    'arteries_images/Maxillary.png',
    'arteries_images/Posterior.png',
    'arteries_images/Asc_pharyngeal.png',
]

// Dictionary to store sources and visibility states for each page
const pageData = {
    "Nerves of the Skull": {
        sources: nervesSources,
        visibility: Array(19).fill(false) // Adjust length as needed
    },
    "Facial muscles and infrahyoid muscles": {
        sources: musclesSources,
        visibility: Array(24).fill(false) // Adjust length as needed
    },
    "Arteries": {
        sources: arterySources,
        visibility: Array(11).fill(false) // Adjust length as needed
    }
};

// Identify the current page and get corresponding data
const pageTitle = document.title;
const { sources: imageSources, visibility: layersVisible } = pageData[pageTitle];


// Function to select or deselect all layers for the current page
function selectAllLayers(select) {
    const checkboxes = document.querySelectorAll('.menu input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = select;
        layersVisible[index] = select;
    });
    draw();
}


// Load images for the current page
function loadImages() {
    imageSources.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            images[index] = img;
            if (index === 0) {
                scale = canvas.height / img.height;
                originX = (canvas.width - img.width * scale) / 2;
            }
            draw();
        };
    });
}

// Draw images based on current layer visibility
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    images.forEach((img, index) => {
        if (layersVisible[index]) {
            ctx.drawImage(img, originX, originY, img.width * scale, img.height * scale);
        }
    });
}

// Toggle individual layer visibility
function toggleLayer(index, isChecked) {
    layersVisible[index] = isChecked;
    draw();
}

// Zoom and pan functionality
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale += e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(scale, 0.1);
    draw();
});

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
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
