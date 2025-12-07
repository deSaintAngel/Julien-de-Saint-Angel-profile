// Gestion modale info projet
function openProjectInfo(project) {
    const modal = document.getElementById('modal-project-info');
    const title = document.getElementById('project-info-title');
    const text = document.getElementById('project-info-text');
    if (project === 'mia') {
        title.textContent = 'MIA : Agent conversationnel';
        text.textContent = "MIA est un agent conversationnel intelligent que j’ai conçu et développé pour converser avec des recruteurs, chercheurs ou simples curieux. Sa mission est de dialoguer autour de mon parcours professionnel et de mes recherches. Basée sur des modèles de langage (LLM) avancés, MIA combine des techniques de traitement du langage naturel, d’automatisation et d’intégration, notamment la technologie RAG (Retrieval-Augmented Generation), pour offrir des réponses pertinentes, fluides et personnalisées à partir de sources documentaires variées. Ce projet illustre ma capacité à concevoir des solutions IA complètes, de l’architecture à la mise en production.";
    } else if (project === 'jobscope') {
        title.textContent = 'JobScope : Outil intelligent de gestion des annonces d’emploi';
        text.textContent = "JobScope est un outil que j’ai développé pour optimiser la gestion et la recherche d’offres d’emploi. Il automatise l’extraction des mots-clés des annonces, lance des recherches ciblées, trie les résultats selon leur pertinence grâce à une analyse ATS (Applicant Tracking System) basée sur des modèles LLM, et intègre un agent conversationnel pour accompagner la rédaction de lettres de motivation personnalisées. JobScope illustre ma capacité à combiner IA, automatisation et expérience utilisateur pour répondre à des besoins concrets.";
    }
    modal.style.display = 'block';
}

function closeProjectInfo() {
    document.getElementById('modal-project-info').style.display = 'none';
}
// Rendre les fonctions accessibles globalement pour le HTML inline
window.switchLanguage = switchLanguage;
window.openHandicapModal = openHandicapModal;
window.closeHandicapModal = closeHandicapModal;
window.toggleHandicapOption = toggleHandicapOption;
window.applyHandicapOptions = applyHandicapOptions;
window.resetHandicapOptions = resetHandicapOptions;
window.showMoreInfo = showMoreInfo;
window.closeMoreInfo = closeMoreInfo;
window.showMoreInfoEN = showMoreInfoEN;
window.closeMoreInfoEN = closeMoreInfoEN;
window.smoothScroll = smoothScroll;
window.toggleSkill = toggleSkill;
// Initialisation EmailJS
(function() {
    emailjs.init("qpozyITgrI4QhqrQR");
})();

// Messages de confirmation
const messages = {
    fr: {
        success: "Merci ! Votre message a bien été envoyé.",
        error: "Erreur lors de l'envoi. Veuillez réessayer."
    },
    en: {
        success: "Thank you! Your message has been sent successfully.",
        error: "Error sending message. Please try again."
    }
};

// Variables pour le mode handicap
let handicapOptions = {
    'handicap-mode': false,
    'high-contrast': false,
    'dyslexia-friendly': false
};

// Gestion du formulaire de contact
document.getElementById('js-contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const currentLang = document.getElementById('fr').style.display !== 'none' ? 'fr' : 'en';
    // Afficher un indicateur de chargement
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = currentLang === 'fr' ? 'Envoi en cours...' : 'Sending...';
    submitBtn.disabled = true;
    emailjs.sendForm('service_l0nkbjv', 'template_12nlhlq', this)
        .then(function() {
            showModal(messages[currentLang].success);
            document.getElementById('js-contact-form').reset();
        }, function(error) {
            showModal(messages[currentLang].error);
            console.error('EmailJS Error:', error);
        })
        .finally(function() {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
});

// Fonctions pour les modales
function showModal(msg) {
    document.getElementById('modal-message').textContent = msg;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showMoreInfo() {
    document.getElementById('modal-info').style.display = 'flex';
}

function closeMoreInfo() {
    document.getElementById('modal-info').style.display = 'none';
}

function showMoreInfoEN() {
    document.getElementById('modal-info-en').style.display = 'flex';
}

function closeMoreInfoEN() {
    document.getElementById('modal-info-en').style.display = 'none';
}

// Navigation multilingue corrigée
function setupNavigation() {
    document.querySelectorAll('.nav-sticky a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            // Récupérer l'ID cible depuis l'attribut data-section
            const targetSection = this.getAttribute('data-section');
            // Déterminer la langue actuelle
            const isFrench = document.getElementById('fr').style.display !== 'none';
            // Mapper les sections françaises vers les sections anglaises
            const sectionMap = {
                'expertise': isFrench ? 'expertise' : 'expertise-en',
                'competences': isFrench ? 'competences' : 'skills-en',
                'projets': isFrench ? 'projets' : 'projects-en',
                'experience': isFrench ? 'experience' : 'experience-en',
                'publications': isFrench ? 'publications' : 'publications-en',
                'contact-form': 'contact-form'
            };
            const targetId = sectionMap[targetSection] || targetSection;
            smoothScroll(targetId);
            // Ajouter l'effet de surbrillance à la section cible
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('highlight');
                setTimeout(() => targetElement.classList.remove('highlight'), 2000);
            }
        });
    });
    // Lien email vers formulaire de contact
    document.querySelectorAll('a[href="#contact-form"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            smoothScroll('contact-form');
        });
    });
}

// Smooth scroll corrigé
function smoothScroll(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Switch de langue CORRIGÉ
function switchLanguage(lang) {
    // Mettre à jour l'attribut lang du HTML pour la détection
    console.log('[switchLanguage] Changement de langue demandé :', lang);
    document.documentElement.lang = lang;
    // Expose the current site language globally so widgets can read it reliably
    window.siteLang = lang;
    
    // Mettre à jour les boutons de langue
    document.getElementById('btn-fr').classList.toggle('active', lang === 'fr');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');

    // Mettre à jour le bouton d'accessibilité
    document.getElementById('handicap-btn-fr').style.display = lang === 'fr' ? 'block' : 'none';
    document.getElementById('handicap-btn-en').style.display = lang === 'fr' ? 'none' : 'block';

    // Afficher/masquer le bon bouton de téléchargement du CV
    const cvFr = document.getElementById('cv-fr');
    const cvEn = document.getElementById('cv-en');
    if (cvFr && cvEn) {
        if (lang === 'fr') {
            cvFr.style.display = '';
            cvEn.style.display = 'none';
        } else {
            cvFr.style.display = 'none';
            cvEn.style.display = '';
        }
    }
    // Gérer l'affichage du contenu
    if (lang === 'fr') {
        document.getElementById('fr').style.display = 'block';
        document.getElementById('en').style.display = 'none';
        document.getElementById('fr-content').style.display = 'block';
        document.getElementById('en-content').style.display = 'none';
        document.querySelector('.hero-subtitle').innerHTML = '<strong>Ingénieur IA & Informatique appliquée</strong><br>Docteur en informatique appliquée - spécialisé en réseaux de neurones hypersphériques et détection d\'anomalies';
        // Bouton Mia en français
        const miaBtn = document.getElementById('open-mia-btn');
        if (miaBtn) {
            miaBtn.innerHTML = '<i class="fas fa-robot"></i> Parler à Mia';
        }
    } else {
        document.getElementById('fr').style.display = 'none';
        document.getElementById('en').style.display = 'block';
        document.getElementById('fr-content').style.display = 'none';
        document.getElementById('en-content').style.display = 'block';
        document.getElementById('modal-handicap').style.display = 'none';
        document.getElementById('modal-handicap-en').style.display = 'none';
        document.querySelector('.hero-subtitle').innerHTML = '<strong>AI & Applied Computer Science Engineer</strong><br>PhD in Applied Computer Science - specialized in hyperspherical neural networks and anomaly detection';
        // Bouton Mia en anglais
        const miaBtn = document.getElementById('open-mia-btn');
        if (miaBtn) {
            miaBtn.innerHTML = '<i class="fas fa-robot"></i> Talk to Mia';
        }
    }

    // Gestion des boutons CV
    const cvBtnFr = document.getElementById('cv-btn-fr');
    const cvBtnEn = document.getElementById('cv-btn-en');
    
    if (cvBtnFr && cvBtnEn) {
        if (lang === 'fr') {
            cvBtnFr.style.display = 'inline-block';
            cvBtnEn.style.display = 'none';
        } else {
            cvBtnFr.style.display = 'none';
            cvBtnEn.style.display = 'inline-block';
        }
    }

    // Réappliquer les options handicap après changement de langue
    setTimeout(() => {
        document.body.classList.remove('handicap-mode', 'high-contrast', 'dyslexia-friendly');
        for (const option in handicapOptions) {
            if (handicapOptions[option]) {
                document.body.classList.add(option);
            }
        }
        // RECONFIGURER LA NAVIGATION pour la nouvelle langue
        setupNavigation();
        setupTags();
    }, 100);

    // Forcer le recalcul de MathJax après le changement de langue
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
        MathJax.typesetPromise();
    }

    // Mettre à jour le texte du bouton robot dans le chat si ouvert
    if (window.miaChatInstance) {
        if (typeof window.miaChatInstance.updateAdBtnText === 'function') {
            window.miaChatInstance.updateAdBtnText();
        }
        // Notify Mia about the site language change so she updates UI/welcome text when opened
        if (typeof window.miaChatInstance.onSiteLanguageChange === 'function') {
            window.miaChatInstance.onSiteLanguageChange(lang);
        }
    }
}

// Animation au défilement (Intersection Observer)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

// Cartes compétences cliquables
function toggleSkill(card) {
    card.classList.toggle('expanded');
}

// Tags cliquables pour filtrage - CORRIGÉ
function setupTags() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const tagValue = this.getAttribute('data-tag');
            const targetSection = this.getAttribute('data-target');
            // Déterminer la langue actuelle
            const isFrench = document.getElementById('fr').style.display !== 'none';
            // Mapper les cibles françaises vers anglaises
            const targetMap = {
                'publications': isFrench ? 'publications' : 'publications-en',
                'expertise': isFrench ? 'expertise' : 'expertise-en',
                'projets': isFrench ? 'projets' : 'projects-en'
            };
            const targetId = targetMap[targetSection] || targetSection;
            // Activer/désactiver le tag
            document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Scroll vers la section cible
            if (targetId) {
                const section = document.getElementById(targetId);
                if (section) {
                    section.classList.add('highlight');
                    setTimeout(() => section.classList.remove('highlight'), 2000);
                    smoothScroll(targetId);
                }
            }
        });
    });
}

// Fermer les modales en cliquant à l'extérieur
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal, .modal-handicap');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Fonctions pour le mode handicap
function openHandicapModal() {
    const currentLang = document.getElementById('fr').style.display !== 'none' ? 'fr' : 'en';
    if (currentLang === 'fr') {
        document.getElementById('modal-handicap').style.display = 'flex';
    } else {
        document.getElementById('modal-handicap-en').style.display = 'flex';
    }
    updateHandicapModalDisplay();
}

function closeHandicapModal() {
    document.getElementById('modal-handicap').style.display = 'none';
    document.getElementById('modal-handicap-en').style.display = 'none';
}

function updateHandicapModalDisplay() {
    const currentLang = document.getElementById('fr').style.display !== 'none' ? 'fr' : 'en';
    // Mettre à jour les deux modales
    const modals = ['modal-handicap', 'modal-handicap-en'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const options = modal.querySelectorAll('.handicap-option');
        options.forEach((opt, index) => {
            let optionKey = '';
            // Identifier par position dans la liste
            switch(index) {
                case 0: optionKey = 'handicap-mode'; break;
                case 1: optionKey = 'high-contrast'; break;
                case 2: optionKey = 'dyslexia-friendly'; break;
            }
            if (handicapOptions[optionKey]) {
                opt.style.background = '#e3f2fd';
                opt.style.border = '2px solid var(--primary-blue)';
            } else {
                opt.style.background = '';
                opt.style.border = '1px solid #e0e0e0';
            }
        });
    });
}

function toggleHandicapOption(option) {
    handicapOptions[option] = !handicapOptions[option];
    updateHandicapModalDisplay();
}

function applyHandicapOptions() {
    document.body.classList.remove('handicap-mode', 'high-contrast', 'dyslexia-friendly');
    for (const option in handicapOptions) {
        if (handicapOptions[option]) {
            document.body.classList.add(option);
        }
    }
    const anyOptionActive = Object.values(handicapOptions).some(opt => opt);
    document.querySelector('.reset-handicap').style.display = anyOptionActive ? 'block' : 'none';
    localStorage.setItem('handicapOptions', JSON.stringify(handicapOptions));
    closeHandicapModal();
    if (anyOptionActive) {
        const currentLang = document.getElementById('fr').style.display !== 'none' ? 'fr' : 'en';
        const message = currentLang === 'fr' 
            ? 'Options d\'accessibilité appliquées.' 
            : 'Accessibility options applied.';
        showModal(message);
    }
}

function resetHandicapOptions() {
    handicapOptions = {
        'handicap-mode': false,
        'high-contrast': false,
        'dyslexia-friendly': false
    };
    document.body.classList.remove('handicap-mode', 'high-contrast', 'dyslexia-friendly');
    document.querySelector('.reset-handicap').style.display = 'none';
    localStorage.setItem('handicapOptions', JSON.stringify(handicapOptions));
    const currentLang = document.getElementById('fr').style.display !== 'none' ? 'fr' : 'en';
    const message = currentLang === 'fr' 
        ? 'Options d\'accessibilité désactivées.' 
        : 'Accessibility options disabled.';
    showModal(message);
}

function loadHandicapPreferences() {
    const savedOptions = localStorage.getItem('handicapOptions');
    if (savedOptions) {
        handicapOptions = JSON.parse(savedOptions);
        document.body.classList.remove('handicap-mode', 'high-contrast', 'dyslexia-friendly');
        for (const option in handicapOptions) {
            if (handicapOptions[option]) {
                document.body.classList.add(option);
            }
        }
        const anyOptionActive = Object.values(handicapOptions).some(opt => opt);
        document.querySelector('.reset-handicap').style.display = anyOptionActive ? 'block' : 'none';
    }
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la navigation
    setupNavigation();
    setupTags();
    // Charger les préférences handicap
    loadHandicapPreferences();
    // Animation au défilement
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // ...existing code...
});
// Configuration MathJax (doit être définie avant le chargement de MathJax)
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
};

(function() {
    emailjs.init("qpozyITgrI4QhqrQR");
})();

// ... (tout le JS original du site, sauf scripts externes) ...


