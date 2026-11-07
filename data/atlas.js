/* Atlas manifest. One entry per diagram (a 'set'); the viewer reads this file only.
 *
 * set.layers are listed in STACKING order: first = bottom, last = top (same as the old site).
 * layer.group      the heading it sits under in the layer panel (must appear in set.groups)
 * layer.labelFor   makes this a label layer: it has no row of its own, and is switched from the
 *                  'Aa' button on its parent's row. It only shows while the parent is showing.
 * layer.on         true = visible when the viewer first opens
 * layer.note       optional small helper text shown under the layer name
 * hero          the layers that build up on the home page: {set, steps:[{label, layer}]}. Steps are shown in order;
 *                the 'Bones' layer is the first step and starts on. Run tools/make_thumbs.py after changing it.
 * set.dir + layer.file = the PNG. All layers in a set must be the same pixel size (set.size).
 * Keep this file valid JSON after the first brace: tools/*.py read it. Run  python3 tools/check_atlas.py  after editing.
 */
window.ATLAS = {
  "hero": {"set": "arteries", "steps": [
    {"label": "Skull and cervical spine", "layer": "bones"},
    {"label": "Common carotid", "layer": "common-carotid-artery"},
    {"label": "External carotid", "layer": "external-carotid-artery"},
    {"label": "Facial artery", "layer": "facial-artery"},
    {"label": "Maxillary artery", "layer": "maxillary-artery"}
  ]},
  "homeGroups": [{"id": "skull", "title": "Skull and vertebral column"}, {"id": "face", "title": "Face and cranial nerves"}, {"id": "jaw", "title": "Jaw and mouth"}, {"id": "neck", "title": "Neck"}],
  "sets": [
    {
      "id": "frontal-skull", "home": "skull", "title": "Frontal skull view",
      "legacy": "frontal_skull.html",
      "dir": "images/frontal_skull", "size": [2732, 2048],
      "groups": ["Skull"],
      "layers": [
        {"id": "bones", "name": "Bones", "file": "bones.png", "group": "Skull", "on": true},
        {"id": "labels", "name": "Labels", "file": "labels.png", "labelFor": "bones"}
      ]
    },
    {
      "id": "three-quarter-skull", "home": "skull", "title": "3/4 skull view",
      "legacy": "3q_skull.html",
      "dir": "images/3q_skull", "size": [2732, 2048],
      "groups": ["Skull"],
      "layers": [
        {"id": "bones", "name": "Bones", "file": "skull.png", "group": "Skull", "on": true},
        {"id": "labels", "name": "Labels", "file": "labels.png", "labelFor": "bones"}
      ]
    },
    {
      "id": "superior-skull", "home": "skull", "title": "Superior view of the skull and foramina",
      "legacy": "superior_skull.html",
      "dir": "images/superior_skull", "size": [2732, 2048],
      "groups": ["Floor of the cranial cavity", "Top of the skull"],
      "layers": [
        {"id": "frontal-bone", "name": "Frontal bone", "file": "frontal.png", "group": "Floor of the cranial cavity", "on": true},
        {"id": "ethmoid-bone", "name": "Ethmoid bone", "file": "ethmoid.png", "group": "Floor of the cranial cavity", "on": true},
        {"id": "sphenoid-bone", "name": "Sphenoid bone", "file": "sphenoid.png", "group": "Floor of the cranial cavity", "on": true},
        {"id": "temporal-bones", "name": "Temporal bones", "file": "temporal.png", "group": "Floor of the cranial cavity", "on": true},
        {"id": "parietal-bones", "name": "Parietal bones", "file": "parietals.png", "group": "Floor of the cranial cavity", "on": true},
        {"id": "occipital-bone", "name": "Occipital bone", "file": "occipital.png", "group": "Floor of the cranial cavity", "on": true},
        {"id": "top-of-frontal-bone", "name": "Top of frontal bone", "file": "frontal_top.png", "group": "Top of the skull"},
        {"id": "top-of-occipital-bone", "name": "Top of occipital bone", "file": "occipital_top.png", "group": "Top of the skull"},
        {"id": "tops-of-parietal-bones", "name": "Tops of parietal bones", "file": "parietals_top.png", "group": "Top of the skull"}
      ]
    },
    {
      "id": "inferior-skull", "home": "skull", "title": "Inferior skull view and foramina",
      "legacy": "inferior_skull.html",
      "dir": "images/inferior_skull", "size": [2732, 2048],
      "groups": ["Skull"],
      "layers": [
        {"id": "bones", "name": "Bones", "file": "bones.png", "group": "Skull", "on": true},
        {"id": "labels", "name": "Labels", "file": "labels.png", "labelFor": "bones"}
      ]
    },
    {
      "id": "paranasal-sinuses", "home": "skull", "title": "Median sagittal view of the skull and paranasal sinuses",
      "legacy": "paranasal.html",
      "dir": "images/paranasal_sinuses", "size": [2732, 2048],
      "groups": ["Bones", "Cartilage and nose"],
      "layers": [
        {"id": "maxilla", "name": "Maxilla", "file": "maxilla.png", "group": "Bones", "on": true},
        {"id": "nose-components", "name": "Nose components", "file": "nose.png", "group": "Cartilage and nose", "on": true},
        {"id": "palatine-bone", "name": "Palatine bone", "file": "Palatine.png", "group": "Bones", "on": true},
        {"id": "sphenoid-bone", "name": "Sphenoid bone", "file": "sphenoid.png", "group": "Bones", "on": true},
        {"id": "ethmoid-bone-and-features", "name": "Ethmoid bone and features", "file": "ethmoid.png", "group": "Bones", "on": true},
        {"id": "nasal-concha", "name": "Nasal concha", "file": "concha.png", "group": "Bones", "on": true},
        {"id": "frontal-bone-and-features", "name": "Frontal bone and features", "file": "frontal.png", "group": "Bones", "on": true},
        {"id": "septal-cartilage", "name": "Septal cartilage", "file": "Septal_cartilage.png", "group": "Cartilage and nose", "on": true},
        {"id": "perpendicular-plate-of-ethmoid-bone", "name": "Perpendicular plate of ethmoid bone", "file": "ethmoid_perp.png", "group": "Bones", "on": true},
        {"id": "vomer", "name": "Vomer", "file": "vomer.png", "group": "Bones", "on": true}
      ]
    },
    {
      "id": "cervical-vertebrae", "home": "skull", "title": "Cervical vertebrae, arteries, veins, and muscles",
      "legacy": "verts.html",
      "dir": "images/vertebrae_images", "size": [2732, 2048],
      "groups": ["Bones", "Muscles", "Arteries", "Veins"],
      "layers": [
        {"id": "bone-labels", "name": "Bone labels", "file": "bone_labels.png", "labelFor": "bones"},
        {"id": "bones", "name": "Bones", "file": "Bones.png", "group": "Bones", "on": true},
        {"id": "longus-capitis", "name": "Longus capitis", "file": "Longus_capitis.png", "group": "Muscles"},
        {"id": "longus-colli", "name": "Longus colli", "file": "Longus_colli.png", "group": "Muscles"},
        {"id": "rectus-muscles", "name": "Rectus muscles", "file": "Rectus_muscles.png", "group": "Muscles"},
        {"id": "posterior-scalenes", "name": "Posterior scalenes", "file": "S_post.png", "group": "Muscles"},
        {"id": "middle-scalenes", "name": "Middle scalenes", "file": "S_med.png", "group": "Muscles"},
        {"id": "key-arteries-with-labels", "name": "Key arteries with labels", "file": "key_arteries.png", "group": "Arteries"},
        {"id": "anterior-scalenes", "name": "Anterior scalenes", "file": "S_ant.png", "group": "Muscles"},
        {"id": "thoracic-and-cervical-veins", "name": "Thoracic and cervical veins", "file": "thoracic_and_neck_veins.png", "group": "Veins"},
        {"id": "internal-jugular-veins-and-branches", "name": "Internal jugular veins and branches", "file": "int_jugs.png", "group": "Veins"}
      ]
    },
    {
      "id": "facial-muscles", "home": "face", "title": "Facial muscles (expression) and infrahyoid muscles",
      "legacy": "facial_muscles.html",
      "dir": "images/facial_muscle_images", "size": [2732, 2048],
      "groups": ["Skull and cartilage", "Muscles of facial expression", "Infrahyoid muscles"],
      "layers": [
        {"id": "bones", "name": "Bones", "file": "Skull.png", "group": "Skull and cartilage", "on": true},
        {"id": "thyroid-cartilage", "name": "Thyroid cartilage", "file": "Thyroid  cartilage.png", "group": "Skull and cartilage"},
        {"id": "corrugator-supercilii", "name": "Corrugator supercilii", "file": "corrugator supercilii.png", "group": "Muscles of facial expression"},
        {"id": "orbicularis-oculi", "name": "Orbicularis oculi", "file": "orbicularis oculi.png", "group": "Muscles of facial expression", "on": true},
        {"id": "frontal-belly-of-occipitofrontalis", "name": "Frontal belly of occipitofrontalis", "file": "frontalis.png", "group": "Muscles of facial expression"},
        {"id": "procerus", "name": "Procerus", "file": "Procerus.png", "group": "Muscles of facial expression"},
        {"id": "levator-anguli-oris", "name": "Levator anguli oris", "file": "levator Anguli oris.png", "group": "Muscles of facial expression"},
        {"id": "levator-labii-superioris", "name": "Levator labii superioris", "file": "Levator labii superioris.png", "group": "Muscles of facial expression"},
        {"id": "levator-labii-superioris-alaeque-nasi", "name": "Levator labii superioris alaeque nasi", "file": "Levator labii superioris alaeque nasi.png", "group": "Muscles of facial expression"},
        {"id": "platysma", "name": "Platysma", "file": "Platysma.png", "group": "Muscles of facial expression"},
        {"id": "mentalis", "name": "Mentalis", "file": "Mentalis.png", "group": "Muscles of facial expression"},
        {"id": "orbicularis-oris", "name": "Orbicularis oris", "file": "Orbicularis oris.png", "group": "Muscles of facial expression", "on": true},
        {"id": "buccinator", "name": "Buccinator", "file": "Buccinator.png", "group": "Muscles of facial expression"},
        {"id": "zygomaticus-minor", "name": "Zygomaticus minor", "file": "Zygomaticus minor.png", "group": "Muscles of facial expression"},
        {"id": "zygomaticus-major", "name": "Zygomaticus major", "file": "zygomaticus major.png", "group": "Muscles of facial expression", "on": true},
        {"id": "nasalis", "name": "Nasalis", "file": "Nasalis .png", "group": "Muscles of facial expression"},
        {"id": "risorius", "name": "Risorius", "file": "Risorius.png", "group": "Muscles of facial expression"},
        {"id": "depressor-labii-inferioris", "name": "Depressor labii inferioris", "file": "Depressor Labii inferioris.png", "group": "Muscles of facial expression"},
        {"id": "depressor-anguli-oris", "name": "Depressor anguli oris", "file": "Depressor anguli oris.png", "group": "Muscles of facial expression"},
        {"id": "thyrohyoid-muscle", "name": "Thyrohyoid muscle", "file": "Thyrohyoid muscle.png", "group": "Infrahyoid muscles"},
        {"id": "sternothyroid-muscle", "name": "Sternothyroid muscle", "file": "Sternothyroid .png", "group": "Infrahyoid muscles"},
        {"id": "sternohyoid-muscle", "name": "Sternohyoid muscle", "file": "Sternohyoid.png", "group": "Infrahyoid muscles"},
        {"id": "omohyoid-muscle", "name": "Omohyoid muscle", "file": "Omohyoid.png", "group": "Infrahyoid muscles"}
      ]
    },
    {
      "id": "cranial-nerves-skull", "home": "face", "title": "Nerves of the skull",
      "hint": "There are many overlapping labels. Turn labels on for one nerve at a time.",
      "legacy": "nerves.html",
      "dir": "images/nerve_images", "size": [2732, 2048],
      "groups": ["Skull", "Nerves"],
      "layers": [
        {"id": "skull", "name": "Skull", "file": "skull_.png", "group": "Skull", "on": true},
        {"id": "skull-labels", "name": "Skull labels", "file": "Skull Labels_.png", "labelFor": "skull"},
        {"id": "pterygopalatine-fossa", "name": "Pterygopalatine fossa", "file": "PTF_.png", "group": "Skull"},
        {"id": "facial-nerve", "name": "Facial nerve", "file": "Facial Nerve_.png", "group": "Nerves"},
        {"id": "facial-nerve-labels", "name": "Facial nerve labels", "file": "Facial nerve labels_.png", "labelFor": "facial-nerve"},
        {"id": "cutaneous-facial-nerve", "name": "Cutaneous facial nerve", "file": "Cutaneous facial_.png", "group": "Nerves"},
        {"id": "cutaneous-facial-nerve-labels", "name": "Cutaneous facial nerve labels", "file": "Cutaneous facial nerve labels_.png", "labelFor": "cutaneous-facial-nerve"},
        {"id": "full-trigeminal-nerve", "name": "Full trigeminal nerve", "file": "Trigeminal Nerve_.png", "group": "Nerves", "on": true},
        {"id": "vagus-nerve", "name": "Vagus nerve", "file": "Vagus_.png", "group": "Nerves"},
        {"id": "vagus-nerve-labels", "name": "Vagus nerve labels", "file": "Vagus nerve labels_.png", "labelFor": "vagus-nerve"},
        {"id": "glossopharyngeal-nerve", "name": "Glossopharyngeal nerve", "file": "Glossopharyngeal_.png", "group": "Nerves"},
        {"id": "glossopharyngeal-nerve-labels", "name": "Glossopharyngeal nerve labels", "file": "Glossopharyngeal labels_.png", "labelFor": "glossopharyngeal-nerve"},
        {"id": "oculomotor-nerve", "name": "Oculomotor nerve", "file": "Oculomotor _.png", "group": "Nerves"},
        {"id": "mandibular-nerve", "name": "Mandibular nerve", "file": "Mandibular nerve_.png", "group": "Nerves"},
        {"id": "mandibular-nerve-labels", "name": "Mandibular nerve labels", "file": "Mandibular nerve labels_.png", "labelFor": "mandibular-nerve"},
        {"id": "maxillary-nerve", "name": "Maxillary nerve", "file": "Maxillary_.png", "group": "Nerves"},
        {"id": "maxillary-nerve-labels", "name": "Maxillary nerve labels", "file": "Maxillary nerve labels_.png", "labelFor": "maxillary-nerve"},
        {"id": "ophthalmic-nerve", "name": "Ophthalmic nerve", "file": "Ophthalmic_.png", "group": "Nerves"},
        {"id": "ophthalmic-nerve-labels", "name": "Ophthalmic nerve labels", "file": "Ophthalmic labels_.png", "labelFor": "ophthalmic-nerve"}
      ]
    },
    {
      "id": "trigeminal-nerve", "home": "face", "title": "Trigeminal nerve and its branches",
      "legacy": "trigeminal_nerve.html",
      "dir": "images/trigeminal", "size": [2732, 2048],
      "groups": ["Skeleton", "Nerves", "Ganglia", "Eye and lacrimal gland"],
      "layers": [
        {"id": "underlying-bony-structures", "name": "Underlying bony structures", "file": "bony_structures.png", "group": "Skeleton", "on": true},
        {"id": "nose-cartilages", "name": "Nose cartilages", "file": "nose_cartilage.png", "group": "Skeleton"},
        {"id": "eye", "name": "Eye", "file": "eye.png", "group": "Eye and lacrimal gland"},
        {"id": "optic-nerve", "name": "Optic nerve", "file": "optic.png", "group": "Nerves"},
        {"id": "outer-layer-of-zygomatic-bone-layer-1", "name": "Outer layer of zygomatic bone, layer 1", "file": "zygomer_layer1.png", "group": "Skeleton"},
        {"id": "maxillary-nerve", "name": "Maxillary nerve", "file": "maxillary_nerve.png", "group": "Nerves"},
        {"id": "outer-layer-of-maxilla", "name": "Outer layer of maxilla", "file": "maxilla_bone_layer.png", "group": "Skeleton"},
        {"id": "pterygopalatine-ganglion", "name": "Pterygopalatine ganglion", "file": "PTG.png", "group": "Ganglia"},
        {"id": "mandibular-nerve", "name": "Mandibular nerve", "file": "mandibular.png", "group": "Nerves"},
        {"id": "lacrimal-gland", "name": "Lacrimal gland", "file": "lacrimal_gland.png", "group": "Eye and lacrimal gland"},
        {"id": "ophthalmic-nerve", "name": "Ophthalmic nerve", "file": "ophthalmic.png", "group": "Nerves"},
        {"id": "ciliary-ganglion", "name": "Ciliary ganglion", "file": "ciliary_ganglion.png", "group": "Ganglia"},
        {"id": "trigeminal-nerve-and-ganglion", "name": "Trigeminal nerve and ganglion", "file": "trigeminal.png", "group": "Nerves", "on": true},
        {"id": "outer-layer-of-zygomatic-bone-layer-2", "name": "Outer layer of zygomatic bone, layer 2", "file": "zygomer_layer2.png", "group": "Skeleton"}
      ]
    },
    {
      "id": "muscles-of-mastication", "home": "jaw", "title": "Muscles of mastication",
      "legacy": "muscles_of_mastication.html",
      "dir": "images/mastication", "size": [2732, 2048],
      "groups": ["Bones", "Temporomandibular joint", "Muscles"],
      "layers": [
        {"id": "bones-of-the-skull", "name": "Bones of the skull", "file": "skull.png", "group": "Bones", "on": true},
        {"id": "labels-of-the-bones-of-the-skull", "name": "Labels of the bones of the skull", "file": "skull_labels.png", "labelFor": "bones-of-the-skull"},
        {"id": "articular-disc", "name": "Articular disc", "file": "tmj .png", "group": "Temporomandibular joint"},
        {"id": "buccinator-muscle", "name": "Buccinator muscle", "file": "buck.png", "group": "Muscles"},
        {"id": "superior-pharyngeal-constrictor", "name": "Superior pharyngeal constrictor", "file": "superior_const.png", "group": "Muscles"},
        {"id": "medial-pterygoid-muscle-deep-head", "name": "Medial pterygoid muscle, deep head", "file": "med_prerygoid.png", "group": "Muscles"},
        {"id": "lateral-pterygoid-muscle-superior-and-inferior-heads", "name": "Lateral pterygoid muscle, superior and inferior heads", "file": "lat_prerygoid.png", "group": "Muscles"},
        {"id": "medial-pterygoid-muscle-superficial-head", "name": "Medial pterygoid muscle, superficial head", "file": "med_pterygoid_sup_head.png", "group": "Muscles"},
        {"id": "coronoid-process", "name": "Coronoid process", "file": "coronoid.png", "group": "Bones", "note": "Many muscles are hidden"},
        {"id": "temporalis-muscle", "name": "Temporalis muscle", "file": "temporalis.png", "group": "Muscles"},
        {"id": "zygomatic-bone", "name": "Zygomatic bone", "file": "removable.png", "group": "Bones", "note": "Features are hidden behind it"},
        {"id": "tmj-capsule-and-lateral-ligament", "name": "TMJ capsule and lateral ligament", "file": "capsule.png", "group": "Temporomandibular joint"},
        {"id": "masseter-muscle", "name": "Masseter muscle", "file": "massseter.png", "group": "Muscles", "note": "Deep and superficial heads", "on": true}
      ]
    },
    {
      "id": "tongue-and-infrahyoids", "home": "jaw", "title": "Tongue and infrahyoid muscles",
      "legacy": "tongue_and_infrahyoids.html",
      "dir": "images/tongue_and_infrahyoids", "size": [2732, 2048],
      "groups": ["Bones and cartilage", "Tongue and floor of mouth", "Infrahyoid muscles", "Pharynx and oesophagus", "Nerves"],
      "layers": [
        {"id": "right-half-of-mandible", "name": "Right half of mandible", "file": "half_of_mandible_bone.png", "group": "Bones and cartilage", "on": true},
        {"id": "cut-mylohyoid-muscle", "name": "Cut mylohyoid muscle", "file": "mylohyoid.png", "group": "Tongue and floor of mouth"},
        {"id": "anterior-belly-of-digastric", "name": "Anterior belly of digastric", "file": "ant_digastric.png", "group": "Tongue and floor of mouth"},
        {"id": "genioglossus-geniohyoid-and-intrinsic-tongue-muscles", "name": "Genioglossus, geniohyoid, and intrinsic tongue muscles", "file": "genio_gloss_hypid.png", "group": "Tongue and floor of mouth"},
        {"id": "tongue-mucosa", "name": "Tongue mucosa", "file": "tongue.png", "group": "Tongue and floor of mouth", "on": true},
        {"id": "hyoid-bone-and-thyrohyoid-membrane", "name": "Hyoid bone and thyrohyoid membrane", "file": "hyoid.png", "group": "Bones and cartilage"},
        {"id": "thyrohyoid-muscle", "name": "Thyrohyoid muscle", "file": "thyrohyoid.png", "group": "Infrahyoid muscles"},
        {"id": "sternothyroid-muscle", "name": "Sternothyroid muscle", "file": "sternothyroid.png", "group": "Infrahyoid muscles"},
        {"id": "sternohyoid-muscle", "name": "Sternohyoid muscle", "file": "sternohyoid.png", "group": "Infrahyoid muscles"},
        {"id": "oesophagus", "name": "Oesophagus", "file": "oesophagus.png", "group": "Pharynx and oesophagus"},
        {"id": "omohyoid-muscle", "name": "Omohyoid muscle", "file": "omohyoid.png", "group": "Infrahyoid muscles"},
        {"id": "middle-pharyngeal-constrictor-muscle", "name": "Middle pharyngeal constrictor muscle", "file": "middle_pharyngeal.png", "group": "Pharynx and oesophagus"},
        {"id": "stylopharyngeus-muscle", "name": "Stylopharyngeus muscle", "file": "stylopharyngeus.png", "group": "Pharynx and oesophagus"},
        {"id": "inferior-pharyngeal-constrictor-muscle", "name": "Inferior pharyngeal constrictor muscle", "file": "inf_pharyngeal_constrictor.png", "group": "Pharynx and oesophagus"},
        {"id": "styloid-process-and-stylohyoid-muscle", "name": "Styloid process and stylohyoid muscle", "file": "styloid_process.png", "group": "Bones and cartilage"},
        {"id": "hyoglossus-muscle", "name": "Hyoglossus muscle", "file": "hyoglossus.png", "group": "Tongue and floor of mouth"},
        {"id": "hypoglossal-nerve", "name": "Hypoglossal nerve", "file": "hypoglossal.png", "group": "Nerves"},
        {"id": "styloglossus-muscle", "name": "Styloglossus muscle", "file": "styloglossus.png", "group": "Tongue and floor of mouth"},
        {"id": "spinal-column", "name": "Spinal column", "file": "spine.png", "group": "Bones and cartilage"},
        {"id": "spinal-nerves", "name": "Spinal nerves", "file": "spinal_nerves.png", "group": "Nerves"},
        {"id": "ansa-cervicalis", "name": "Ansa cervicalis", "file": "ansa.png", "group": "Nerves"},
        {"id": "left-view-of-mandible", "name": "Left view of mandible", "file": "outer_view_mandible.png", "group": "Bones and cartilage"}
      ]
    },
    {
      "id": "arteries", "home": "neck", "title": "Arteries of the head and neck",
      "legacy": "arteries.html",
      "dir": "images/arteries_images", "size": [2048, 2732],
      "groups": ["Bones", "Main arteries", "Branches of the external carotid"],
      "layers": [
        {"id": "subclavian-and-branches", "name": "Subclavian and branches", "file": "Subclavian_and_branches.png", "group": "Main arteries"},
        {"id": "bones", "name": "Bones", "file": "Bones.png", "group": "Bones", "on": true},
        {"id": "common-carotid-artery", "name": "Common carotid artery", "file": "Common_Carotid.png", "group": "Main arteries", "on": true},
        {"id": "external-carotid-artery", "name": "External carotid artery", "file": "Ext_carotid_and_branches.png", "group": "Main arteries", "on": true},
        {"id": "superior-thyroid-artery", "name": "Superior thyroid artery", "file": "Superior_Thyroid.png", "group": "Branches of the external carotid"},
        {"id": "lingual-artery", "name": "Lingual artery", "file": "Lingual_Artery.png", "group": "Branches of the external carotid"},
        {"id": "facial-artery", "name": "Facial artery", "file": "Facial_Artery.png", "group": "Branches of the external carotid"},
        {"id": "superficial-temporal-artery", "name": "Superficial temporal artery", "file": "superficial_temporal.png", "group": "Branches of the external carotid"},
        {"id": "maxillary-artery", "name": "Maxillary artery", "file": "Maxillary.png", "group": "Branches of the external carotid"},
        {"id": "posterior-auricular-and-occipital-artery", "name": "Posterior auricular and occipital artery", "file": "Posterior.png", "group": "Branches of the external carotid"},
        {"id": "ascending-pharyngeal-artery", "name": "Ascending pharyngeal artery", "file": "Asc_pharnygeal.png", "group": "Branches of the external carotid"}
      ]
    },
    {
      "id": "veins", "home": "neck", "title": "Veins of the head and neck (sagittal view)",
      "legacy": "veins_sag.html",
      "dir": "images/veins_sag_images", "size": [2048, 2732],
      "groups": ["Bones", "Veins"],
      "layers": [
        {"id": "bones", "name": "Bones", "file": "Bones.png", "group": "Bones", "on": true},
        {"id": "external-jugular-vein", "name": "External jugular vein", "file": "ext_jug.png", "group": "Veins", "on": true},
        {"id": "facial-vein-deep-facial-and-common-facial", "name": "Facial vein, deep facial, and common facial", "file": "facial.png", "group": "Veins"},
        {"id": "internal-jugular-vein", "name": "Internal jugular vein", "file": "I_jug.png", "group": "Veins", "on": true},
        {"id": "occipital-vein", "name": "Occipital vein", "file": "occipital.png", "group": "Veins"},
        {"id": "posterior-auricular-vein", "name": "Posterior auricular vein", "file": "post_auricular.png", "group": "Veins"},
        {"id": "pterygoid-venous-plexus", "name": "Pterygoid venous plexus", "file": "Pterygoid_venous_plexus.png", "group": "Veins"},
        {"id": "retromandibular-vein", "name": "Retromandibular vein", "file": "retro.png", "group": "Veins"},
        {"id": "superior-and-middle-thyroid-veins", "name": "Superior and middle thyroid veins", "file": "sup_a_mid_thyroid_veins.png", "group": "Veins"},
        {"id": "superficial-temporal-veins", "name": "Superficial temporal veins", "file": "sup_temporal.png", "group": "Veins"}
      ]
    },
    {
      "id": "lymph-nodes", "home": "neck", "title": "Lymph nodes of the head and neck",
      "legacy": "lymph_nodes.html",
      "dir": "images/lymph_nodes", "size": [2048, 2732],
      "groups": ["Bones", "Muscles and soft tissue", "Lymph nodes"],
      "layers": [
        {"id": "bones", "name": "Bones", "file": "bones.png", "group": "Bones", "on": true},
        {"id": "muscles-of-mastication", "name": "Muscles of mastication", "file": "mastication.png", "group": "Muscles and soft tissue"},
        {"id": "zygomatic-bone", "name": "Zygomatic bone", "file": "zygomer.png", "group": "Bones", "note": "Hides the muscles"},
        {"id": "muscles-of-facial-expression", "name": "Muscles of facial expression", "file": "muscles_of_facial_expression.png", "group": "Muscles and soft tissue"},
        {"id": "miscellaneous-neck-structures", "name": "Miscellaneous neck structures", "file": "neck_stuff.png", "group": "Muscles and soft tissue"},
        {"id": "parotid-gland", "name": "Parotid gland", "file": "parotid_gland.png", "group": "Muscles and soft tissue"},
        {"id": "trapezius-muscle", "name": "Trapezius muscle", "file": "trapezius.png", "group": "Muscles and soft tissue"},
        {"id": "deep-cervical-lymph-nodes", "name": "Deep cervical lymph nodes", "file": "deep_cervical_nodes.png", "group": "Lymph nodes", "on": true},
        {"id": "sternocleidomastoid-muscle", "name": "Sternocleidomastoid muscle", "file": "SCM.png", "group": "Muscles and soft tissue"},
        {"id": "retroauricular-and-occipital-lymph-nodes", "name": "Retroauricular and occipital lymph nodes", "file": "RA_O_nodes.png", "group": "Lymph nodes"},
        {"id": "superficial-parotid-and-buccal-lymph-nodes", "name": "Superficial parotid and buccal lymph nodes", "file": "SP_B_nodes.png", "group": "Lymph nodes"},
        {"id": "superficial-cervical-lymph-nodes", "name": "Superficial cervical lymph nodes", "file": "sup_cervical_nodes.png", "group": "Lymph nodes", "on": true}
      ]
    },
    {
      "id": "larynx-lateral", "home": "neck", "title": "Lateral view of the larynx",
      "legacy": "lateral_larynx.html",
      "dir": "images/lateral_larynx", "size": [2732, 2048],
      "groups": ["Cartilage", "Muscles", "Membranes"],
      "layers": [
        {"id": "cartilages-of-the-larynx", "name": "Cartilages of the larynx", "file": "cartilages.png", "group": "Cartilage", "on": true},
        {"id": "larynx-labels", "name": "Larynx labels", "file": "Larynx_labels.png", "labelFor": "cartilages-of-the-larynx"},
        {"id": "thyroepiglottic-aryepiglottic-thyroarytenoid-and-vocalis", "name": "Thyroepiglottic, aryepiglottic, thyroarytenoid, and vocalis", "file": "TE_AE_V_TA.png", "group": "Muscles"},
        {"id": "lateral-and-posterior-cricoarytenoid-muscles", "name": "Lateral and posterior cricoarytenoid muscles", "file": "cricothyroids.png", "group": "Muscles"},
        {"id": "oblique-and-transverse-arytenoids", "name": "Oblique and transverse arytenoids", "file": "oblique_and_transverse.png", "group": "Muscles"},
        {"id": "quadrangular-membrane-and-conus-elasticus", "name": "Quadrangular membrane and conus elasticus", "file": "quadrangular_and_conus.png", "group": "Membranes"}
      ]
    },
    {
      "id": "larynx-superior", "home": "neck", "title": "Superior view of the larynx",
      "legacy": "superior_larynx.html",
      "dir": "images/superior_larynx", "size": [2732, 2048],
      "groups": ["Cartilage", "Muscles"],
      "layers": [
        {"id": "cartilages-of-the-larynx", "name": "Cartilages of the larynx", "file": "cartilages.png", "group": "Cartilage", "on": true},
        {"id": "larynx-labels", "name": "Larynx labels", "file": "cartilage_labels.png", "labelFor": "cartilages-of-the-larynx"},
        {"id": "posterior-cricoarytenoids", "name": "Posterior cricoarytenoids", "file": "posterior_cricoarytenoids.png", "group": "Muscles"},
        {"id": "lateral-cricoarytenoids", "name": "Lateral cricoarytenoids", "file": "lat_cricoarytenoids.png", "group": "Muscles"},
        {"id": "oblique-and-transverse-arytenoids", "name": "Oblique and transverse arytenoids", "file": "transverse_and_obliques.png", "group": "Muscles"},
        {"id": "vocalis-muscle", "name": "Vocalis muscle", "file": "vocalis.png", "group": "Muscles"},
        {"id": "thyroarytenoid-muscles", "name": "Thyroarytenoid muscles", "file": "thyroarytenoids.png", "group": "Muscles"},
        {"id": "cricothyroid-muscles", "name": "Cricothyroid muscles", "file": "cricothyroids.png", "group": "Muscles"}
      ]
    }
  ]
};
