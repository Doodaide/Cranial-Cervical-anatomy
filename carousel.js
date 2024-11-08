// Array of images and captions
const images = [
    { src: "images/legacy_lab_doodles/i1.png", caption: "Image 1: A faded diagram of the triangles of the neck (not very useful)" },
    { src: "images/legacy_lab_doodles/i2.png", caption: "Image 2: Pre-vertebral muscles and attachments to cervical and thoracic spinal column" },
    { src: "images/legacy_lab_doodles/i3.png", caption: "Image 3: Hypoglossal nerve and cervical plexus" },
    { src: "images/legacy_lab_doodles/i4.png", caption: "Image 4: Internal and external carotid artery and branches" },
    { src: "images/legacy_lab_doodles/i5.png", caption: "Image 5: Anterior view of neck vasculature" },
    { src: "images/legacy_lab_doodles/i6.png", caption: "Image 6: Maxillary and internal carotid branch (opthalmic artery)" },
    { src: "images/legacy_lab_doodles/i7.png", caption: "Image 7: Arteries of the neck" },
    { src: "images/legacy_lab_doodles/i8.png", caption: "Image 8: Combined image of the images 6-7" },
    { src: "images/legacy_lab_doodles/i9.png", caption: "Image 9: Veinous tributary summary" },
    { src: "images/legacy_lab_doodles/i10.png", caption: "Image 10: Some common structure and vasculature" },
    { src: "images/legacy_lab_doodles/i11.png", caption: "Image 11: Subclavian vein (left) and tributaries" },
    { src: "images/legacy_lab_doodles/i12.png", caption: "Image 12: Dural venous sinuses" },
    { src: "images/legacy_lab_doodles/i13.png", caption: "Image 13: TMJ, key features, and muscles" },
    { src: "images/legacy_lab_doodles/i14.png", caption: "Image 14: Muscles of mastication directions of movement, and venous drainage" },
    { src: "images/legacy_lab_doodles/i15.png", caption: "Image 15: Mandibular nerve, connections, and key spatial distribution" },
    { src: "images/legacy_lab_doodles/i16.png", caption: "Image 16: Muscles of the neck and base of skull" },
    { src: "images/legacy_lab_doodles/i17.png", caption: "Image 17: Anterior view of some infrahyoid and suprahyoid muscles" },
    { src: "images/legacy_lab_doodles/i18.png", caption: "Image 18: Facial muscles and nerve motor innervationss" },
    { src: "images/legacy_lab_doodles/i19.png", caption: "Image 19: Facial muscles and nerve sensory innervations" },
    { src: "images/legacy_lab_doodles/i20.png", caption: "Image 20: Some more facial muscles and a spot test result" },
    { src: "images/legacy_lab_doodles/i21.png", caption: "Image 21: Simplified facial nerve distribution" },
    { src: "images/legacy_lab_doodles/i22.png", caption: "Image 22: Simplified tympanic plexus distribution" },
    { src: "images/legacy_lab_doodles/i23.png", caption: "Image 23: Inner ear structures" },
    { src: "images/legacy_lab_doodles/i24.png", caption: "Image 24: Whole ear, external, middle and inner ear diagram" },
    { src: "images/legacy_lab_doodles/i25.png", caption: "Image 25: No clue what this is haha" },
    { src: "images/legacy_lab_doodles/i26.png", caption: "Image 26: Inferior (underside) view of temporal bone" },
    { src: "images/legacy_lab_doodles/i27.png", caption: "Image 27: Simplified inferior view of skull and key foramina" },
    { src: "images/legacy_lab_doodles/i28.png", caption: "Image 28: Simplified anterior view of skull and key foramina" },
    { src: "images/legacy_lab_doodles/i29.png", caption: "Image 29: Sutures, mandible, and inner cranial fossa (with associated foramina)" },
    { src: "images/legacy_lab_doodles/i30.png", caption: "Image 30: Infratemporal fossa and pterygopalatine fossa" },
    { src: "images/legacy_lab_doodles/i31.png", caption: "Image 31: Superficial lymph nodes of the head and neck" },
    { src: "images/legacy_lab_doodles/i32.png", caption: "Image 32: Simplified lymphatic drainage" },
    { src: "images/legacy_lab_doodles/i33.png", caption: "Image 33: Deep cranial and cervical lymph nodes " },
    { src: "images/legacy_lab_doodles/i34.png", caption: "Image 34: More on the lymph nodes apparently" },
    { src: "images/legacy_lab_doodles/i35.png", caption: "Image 35: Key sensory and parasympathetic ganglia of the head and neck locations" },
    { src: "images/legacy_lab_doodles/i36.png", caption: "Image 36: Neck ganglia and how the sympathetic chain works with the spinal cord" },
    { src: "images/legacy_lab_doodles/i37.png", caption: "Image 37: Simplified trigeminal nerve pathways" },
    { src: "images/legacy_lab_doodles/i38.png", caption: "Image 38: Autonomic nervous system details" },
    { src: "images/legacy_lab_doodles/i39.png", caption: "Image 39: Diagram of the eye and associated strctures" },
    { src: "images/legacy_lab_doodles/i40.png", caption: "Image 40: Cross section of the eyeball and vasculature" },
    { src: "images/legacy_lab_doodles/i41.png", caption: "Image 41: Side view of thyroid, cricoid, arytenoid, and epiglottic cartilages (larynx)" },
    { src: "images/legacy_lab_doodles/i42.png", caption: "Image 42: Superior view of key muscles of larynx and associated functions" },
    { src: "images/legacy_lab_doodles/i43.png", caption: "Image 43: Anterior view of larynx, arteries and nerves" },
    { src: "images/legacy_lab_doodles/i44.png", caption: "Image 44: Posterolateral view of larynx and associated muscles/cartilages" },
    { src: "images/legacy_lab_doodles/i45.png", caption: "Image 45: Diagram of tongue and I have no idea what the other one is" },
    { src: "images/legacy_lab_doodles/i46.png", caption: "Image 46: Some worksheet and a diagram of the innervation of parotid gland from glossopharyngeal nerve" },
    { src: "images/legacy_lab_doodles/i47.png", caption: "Image 47: Another hypoglossal cervical plexus diagram" },
    { src: "images/legacy_lab_doodles/i48.png", caption: "Image 48: Oral cavity and key muscles" },
    { src: "images/legacy_lab_doodles/i49.png", caption: "Image 49: Tensor and levator palati" },
    { src: "images/legacy_lab_doodles/i50.png", caption: "Image 50: Ophthalmic and Maxillary nerve distribution" },
    { src: "images/legacy_lab_doodles/i51.png", caption: "Image 51: Nerves of the nasal cavity" },
    { src: "images/legacy_lab_doodles/i52.png", caption: "Image 52: Pterygopalatine fossa and associated foramina/nerves, and arteries of nasal cavity" },
    { src: "images/legacy_lab_doodles/i53.png", caption: "Image 53: Facial nerve path to pterygopalatine fossa" },
    // Add more images as needed
];

let currentIndex = 0;

// Function to update the displayed image and caption
function updateCarousel() {
    const carouselImage = document.getElementById("carousel-image");
    const carouselCaption = document.getElementById("carousel-caption");

    carouselImage.src = images[currentIndex].src;
    carouselCaption.textContent = images[currentIndex].caption;
}

// Navigation buttons
document.getElementById("prev-btn").addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateCarousel();
});

document.getElementById("next-btn").addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateCarousel();
});

// Keyboard navigation
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateCarousel();
    } else if (event.key === "ArrowRight") {
        currentIndex = (currentIndex + 1) % images.length;
        updateCarousel();
    }
});

// Initialize the carousel with the first image
updateCarousel();
