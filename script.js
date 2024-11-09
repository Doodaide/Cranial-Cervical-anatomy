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
    'images/nerve_images/skull_.png', 
    'images/nerve_images/Skull Labels_.png', 
    'images/nerve_images/PTF_.png',
    'images/nerve_images/Facial Nerve_.png',
    'images/nerve_images/Facial nerve labels_.png',
    'images/nerve_images/Cutaneous facial_.png',
    'images/nerve_images/Cutaneous facial nerve labels_.png',
    'images/nerve_images/Trigeminal Nerve_.png',
    'images/nerve_images/Vagus_.png',
    'images/nerve_images/Vagus nerve labels_.png',
    'images/nerve_images/Glossopharyngeal_.png', 
    'images/nerve_images/Glossopharyngeal labels_.png',
    'images/nerve_images/Oculomotor _.png',
    'images/nerve_images/Mandibular nerve_.png',
    'images/nerve_images/Mandibular nerve labels_.png',
    'images/nerve_images/Maxillary_.png', 
    'images/nerve_images/Maxillary nerve labels_.png',
    'images/nerve_images/Ophthalmic_.png',
    'images/nerve_images/Ophthalmic labels_.png'
];

const musclesSources = [
    'images/facial_muscle_images/Skull.png', //0
    'images/facial_muscle_images/Thyroid  cartilage.png', //1
    'images/facial_muscle_images/corrugator supercilii.png', //2
    'images/facial_muscle_images/orbicularis oculi.png', // 3
    'images/facial_muscle_images/frontalis.png', // 4
    'images/facial_muscle_images/Procerus.png', // 5
    'images/facial_muscle_images/levator Anguli oris.png', // 6
    'images/facial_muscle_images/Levator labii superioris.png', // 7
    'images/facial_muscle_images/Levator labii superioris alaeque nasi.png', //8 
    
    'images/facial_muscle_images/Platysma.png', // 9
    'images/facial_muscle_images/Mentalis.png', // 10
    'images/facial_muscle_images/Orbicularis oris.png',
    'images/facial_muscle_images/Buccinator.png',
    'images/facial_muscle_images/Zygomaticus minor.png',
    'images/facial_muscle_images/zygomaticus major.png',
    'images/facial_muscle_images/Nasalis .png',
    'images/facial_muscle_images/Risorius.png',
    'images/facial_muscle_images/Depressor Labii inferioris.png',
    'images/facial_muscle_images/Depressor anguli oris.png',
    'images/facial_muscle_images/Thyrohyoid muscle.png',
    'images/facial_muscle_images/Sternothyroid .png',
    'images/facial_muscle_images/Sternohyoid.png',
    'images/facial_muscle_images/Omohyoid.png',
];

const arterySources = [
    'images/arteries_images/Subclavian_and_branches.png', 
    'images/arteries_images/Bones.png',
    'images/arteries_images/Common_Carotid.png',
    'images/arteries_images/Ext_carotid_and_branches.png',
    'images/arteries_images/Superior_Thyroid.png',
    'images/arteries_images/Lingual_Artery.png',
    'images/arteries_images/Facial_Artery.png',
    'images/arteries_images/superficial_temporal.png',
    'images/arteries_images/Maxillary.png',
    'images/arteries_images/Posterior.png',
    'images/arteries_images/Asc_pharyngeal.png',
]

const vertsSources = [
    'images/vertebrae_images/bone_labels.png', 
    'images/vertebrae_images/Bones.png', 
    'images/vertebrae_images/key_arteries.png', 
    'images/vertebrae_images/Longus_capitis.png', 
    'images/vertebrae_images/Longus_colli.png', 
    'images/vertebrae_images/Rectus_muscles.png',
    'images/vertebrae_images/S_ant.png', 
    'images/vertebrae_images/S_med.png', 
    'images/vertebrae_images/S_post.png',
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
    },
    "Cervical vertebrae, arteries, and muscles": {
        sources: vertsSources,
        visibility: Array(9).fill(false)
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
