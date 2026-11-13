/**
 * FreelanceWithVenkat - Interactive Logic & Application Engine
 */

function hidePreloader() {
  const preloader = document.getElementById('page-preloader');
  if (preloader && !preloader.classList.contains('preloader-hidden')) {
    preloader.classList.add('preloader-hidden');
    setTimeout(() => {
      preloader.style.display = 'none';
      preloader.setAttribute('aria-hidden', 'true');
    }, 550);
  }
}

function updateHeaderOffset() {
  const topNav = document.querySelector('header');
  if (topNav) {
    const height = topNav.offsetHeight;
    const additionalGap = 28; // 28px visual spacing below navbar
    document.documentElement.style.setProperty('--header-height', `${height}px`);
    document.documentElement.style.setProperty('--scroll-offset', `${height + additionalGap}px`);
  }
}

// Fade out preloader when all assets are loaded
window.addEventListener('load', () => {
  updateHeaderOffset();
  setTimeout(hidePreloader, 150);
});

// Resizing adjusts offset
window.addEventListener('resize', updateHeaderOffset);

// Failsafe: Ensure preloader NEVER gets stuck even if assets or network lag
setTimeout(hidePreloader, 1200);

document.addEventListener('DOMContentLoaded', () => {
  updateHeaderOffset();
  initMobileMenu();
  initSmoothScroll();
  initScrollSpy();
  initRevealAnimations();
  initHeroTypewriter();
  initHeroParallax();
  initProjectModals();
  initCardCarousels();
  initContactForm();
});

function setActiveNav(targetId) {
  const cleanId = targetId.replace(/^#/, '');
  const navLinks = document.querySelectorAll('header nav a[href^="#"], #mobile-menu a[href^="#"]');
  navLinks.forEach(link => {
    const href = link.getAttribute('href').replace(/^#/, '');
    if (href === cleanId) {
      link.classList.add('text-primary', 'font-semibold');
      link.classList.remove('text-on-surface-variant');
    } else {
      link.classList.remove('text-primary', 'font-semibold');
      link.classList.add('text-on-surface-variant');
    }
  });
}

/* Smooth Navigation Scroll with Dynamic Sticky Header Offset */
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  const getScrollOffset = () => {
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 64;
    return headerHeight + 28; // Navbar height + 28px additional visual gap
  };

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      if (targetId === '#home') {
        e.preventDefault();
        setActiveNav('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (history.pushState) history.pushState(null, null, targetId);
        return;
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();

        // Immediately update active nav link indicator
        setActiveNav(targetId);

        // Close mobile menu drawer first if open
        const mobileMenu = document.getElementById('mobile-menu');
        const toggleBtn = document.getElementById('mobile-menu-btn');
        const iconOpen = document.getElementById('menu-icon-open');
        const iconClose = document.getElementById('menu-icon-close');

        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
          if (iconOpen && iconClose) {
            iconOpen.classList.remove('hidden');
            iconClose.classList.add('hidden');
          }
        }

        const totalOffset = getScrollOffset();
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = Math.max(0, elementPosition - totalOffset);

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update URL hash cleanly without viewport jump
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  // Handle direct hash navigation on initial load and page refresh (e.g., /#contact)
  const handleInitialHash = () => {
    if (window.location.hash) {
      const hashTarget = document.querySelector(window.location.hash);
      if (hashTarget) {
        setTimeout(() => {
          const totalOffset = getScrollOffset();
          const elementPosition = hashTarget.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = Math.max(0, elementPosition - totalOffset);

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          setActiveNav(window.location.hash);
        }, 150);
      }
    }
  };

  window.addEventListener('load', handleInitialHash);
  if (document.readyState === 'complete') {
    handleInitialHash();
  }
}

/* 2. Scroll Spy & Active Nav Link Indicator */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  if (sections.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-15% 0px -45% 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        setActiveNav(activeId);
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/* 0. Hero Typewriter & Mouse Parallax */
function initHeroTypewriter() {
  const target = document.getElementById('hero-typed-text');
  if (!target) return;

  const phrases = [
    'custom websites',
    'business landing pages',
    'celebration sites',
    'academic portfolios'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function typeStep() {
    const currentPhrase = phrases[phraseIdx];
    if (isDeleting) {
      charIdx--;
      target.textContent = currentPhrase.substring(0, charIdx);
    } else {
      charIdx++;
      target.textContent = currentPhrase.substring(0, charIdx);
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIdx === currentPhrase.length) {
      typeSpeed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      typeSpeed = 400;
    }

    setTimeout(typeStep, typeSpeed);
  }

  typeStep();
}

function initHeroParallax() {
  const blob = document.getElementById('hero-interactive-blob');
  const heroSec = document.getElementById('home') || document.getElementById('hero');

  if (!blob || !heroSec) return;

  heroSec.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const offsetX = (clientX / innerWidth - 0.5) * 35;
    const offsetY = (clientY / innerHeight - 0.5) * 35;

    blob.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
}

/* 1. Mobile Menu Toggle */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.mobile-nav-link');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');

  if (!toggleBtn || !mobileMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    mobileMenu.classList.toggle('hidden');

    if (iconOpen && iconClose) {
      iconOpen.classList.toggle('hidden', !isExpanded);
      iconClose.classList.toggle('hidden', isExpanded);
    }
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      toggleBtn.setAttribute('aria-expanded', 'false');
      if (iconOpen && iconClose) {
        iconOpen.classList.remove('hidden');
        iconClose.classList.add('hidden');
      }
    });
  });
}

/* 3. Reveal on Scroll (Intersection Observer) */
function initRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => observer.observe(el));
}

/* 4. Interactive Project Detail Modals & Image Carousel */
const projectData = {
  supermarket: {
    title: 'SuperMarketApp - Fresh Grocery E-Commerce',
    category: 'E-commerce / Mobile Web App',
    images: [
      'public/Supermarket img/5.png',
      'public/Supermarket img/6.png',
      'public/Supermarket img/7.png',
      'public/Supermarket img/8.png',
      'public/Supermarket img/9.png',
      'public/Supermarket img/10.png'
    ],
    description: 'Enables users to browse, select, and purchase fresh groceries with fast delivery through a clean, easy-to-navigate mobile shopping experience with Google Auth integration.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'Google Auth API', 'Vercel'],
    link: 'https://super-market-app-neon.vercel.app/'
  },
  flowershop: {
    title: 'Flower Shop Thanjavur - Florist Platform',
    category: 'E-commerce / Florist Platform',
    images: [
      'public/FlowerShop/1.png',
      'public/FlowerShop/2.png',
      'public/FlowerShop/3.png',
      'public/FlowerShop/4.png',
      'public/FlowerShop/5.png'
    ],
    description: 'Handcrafted bouquets & floral decor website featuring custom bouquet configurator, WhatsApp instant order integration, same-day local delivery scheduling, and daily temple pooja floral subscriptions.',
    stack: ['JavaScript', 'HTML5', 'Modern CSS', 'WhatsApp Business API', 'Netlify'],
    link: 'https://flowershopz.netlify.app/'
  },
  sellerrocket: {
    title: 'Seller Rocket - E-Commerce Lead Funnel',
    category: 'E-Commerce / Lead Generation Platform',
    images: [
      'public/Seller Rocket/1.png',
      'public/Seller Rocket/2.png',
      'public/Seller Rocket/3.png',
      'public/Seller Rocket/4.png'
    ],
    description: 'Connects businesses with expert e-commerce solutions including Amazon account management, Shopify storefront setup, and custom WordPress development through high-conversion lead generation forms.',
    stack: ['React', 'Vite', 'Node.js', 'Tailwind CSS', 'Vercel'],
    link: 'https://sellerrocket-venkateswaran.vercel.app/'
  }
};

/* 4. Interactive Project Detail Modals & Auto Image Carousel */
let currentCarouselImages = [];
let currentCarouselIndex = 0;
let modalAutoTimer = null;
let isModalCarouselHovered = false;

function startModalAutoPlay() {
  stopModalAutoPlay();
  if (!currentCarouselImages || currentCarouselImages.length <= 1) return;

  modalAutoTimer = setInterval(() => {
    if (!isModalCarouselHovered) {
      updateCarouselDisplay(currentCarouselIndex + 1, false);
    }
  }, 3500);
}

function stopModalAutoPlay() {
  if (modalAutoTimer) {
    clearInterval(modalAutoTimer);
    modalAutoTimer = null;
  }
}

function updateCarouselDisplay(index, resetTimer = true) {
  if (!currentCarouselImages || currentCarouselImages.length === 0) return;

  if (index < 0) currentCarouselIndex = currentCarouselImages.length - 1;
  else if (index >= currentCarouselImages.length) currentCarouselIndex = 0;
  else currentCarouselIndex = index;

  const mainImg = document.getElementById('carousel-main-image');
  const counter = document.getElementById('carousel-counter');
  const dotsContainer = document.getElementById('carousel-dots');
  const thumbsContainer = document.getElementById('carousel-thumbnails');

  if (mainImg) {
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = currentCarouselImages[currentCarouselIndex];
      mainImg.style.opacity = '1';
    }, 120);
  }

  if (counter) {
    counter.textContent = `${currentCarouselIndex + 1} / ${currentCarouselImages.length}`;
  }

  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('button');
    dots.forEach((dot, i) => {
      if (i === currentCarouselIndex) {
        dot.className = 'w-5 h-2 bg-primary rounded-full transition-all duration-300 shadow-sm';
      } else {
        dot.className = 'w-2 h-2 bg-white/60 hover:bg-white rounded-full transition-all duration-300';
      }
    });
  }

  if (thumbsContainer) {
    const thumbs = thumbsContainer.querySelectorAll('img');
    thumbs.forEach((thumb, i) => {
      if (i === currentCarouselIndex) {
        thumb.className = 'w-16 h-12 object-cover rounded-md border-2 border-primary cursor-pointer transition-all scale-105 shadow-sm opacity-100';
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        thumb.className = 'w-16 h-12 object-cover rounded-md border border-outline-variant/40 opacity-50 hover:opacity-100 cursor-pointer transition-all hover:scale-100';
      }
    });
  }

  if (resetTimer) {
    startModalAutoPlay();
  }
}

function initCarousel(images) {
  currentCarouselImages = images || [];
  currentCarouselIndex = 0;
  isModalCarouselHovered = false;

  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');
  const dotsContainer = document.getElementById('carousel-dots');
  const thumbsContainer = document.getElementById('carousel-thumbnails');
  const mainImg = document.getElementById('carousel-main-image');

  if (dotsContainer) {
    dotsContainer.innerHTML = currentCarouselImages.map((_, i) =>
      `<button data-slide-index="${i}" aria-label="Go to slide ${i + 1}" class="${i === 0 ? 'w-5 h-2 bg-primary rounded-full' : 'w-2 h-2 bg-white/60 rounded-full'} transition-all duration-300"></button>`
    ).join('');

    dotsContainer.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-slide-index'), 10);
        updateCarouselDisplay(idx);
      };
    });
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = currentCarouselImages.map((imgSrc, i) =>
      `<img src="${imgSrc}" alt="Thumbnail ${i + 1}" data-thumb-index="${i}" class="w-16 h-12 object-cover rounded-md border ${i === 0 ? 'border-primary border-2 scale-105 opacity-100' : 'border-outline-variant/40 opacity-50'} hover:opacity-100 cursor-pointer transition-all">`
    ).join('');

    thumbsContainer.querySelectorAll('img').forEach(thumb => {
      thumb.onclick = () => {
        const idx = parseInt(thumb.getAttribute('data-thumb-index'), 10);
        updateCarouselDisplay(idx);
      };
    });
  }

  if (prevBtn) prevBtn.onclick = () => updateCarouselDisplay(currentCarouselIndex - 1);
  if (nextBtn) nextBtn.onclick = () => updateCarouselDisplay(currentCarouselIndex + 1);

  if (mainImg && mainImg.parentElement) {
    mainImg.parentElement.onmouseenter = () => { isModalCarouselHovered = true; };
    mainImg.parentElement.onmouseleave = () => { isModalCarouselHovered = false; };
  }

  updateCarouselDisplay(0, false);
  startModalAutoPlay();
}

function initProjectModals() {
  const modal = document.getElementById('project-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const projectBtns = document.querySelectorAll('[data-project-target]');

  if (!modal) return;

  projectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-project-target');
      const data = projectData[targetId];

      if (data) {
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-category').textContent = data.category;
        document.getElementById('modal-description').textContent = data.description;

        initCarousel(data.images);

        const modalLiveLink = document.getElementById('modal-live-link');
        if (modalLiveLink) modalLiveLink.href = data.link;

        const stackContainer = document.getElementById('modal-stack');
        stackContainer.innerHTML = data.stack.map(tech =>
          `<span class="inline-flex items-center bg-surface-container text-on-surface px-3 py-1 rounded-full text-xs font-medium">${tech}</span>`
        ).join('');

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeModal = () => {
    stopModalAutoPlay();
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Keyboard navigation for Carousel & Modal
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') {
        updateCarouselDisplay(currentCarouselIndex - 1);
      } else if (e.key === 'ArrowRight') {
        updateCarouselDisplay(currentCarouselIndex + 1);
      } else if (e.key === 'Escape') {
        closeModal();
      }
    }
  });

  // Touch swipe support for mobile devices
  let touchStartX = 0;
  let touchEndX = 0;
  const mainDisplay = document.getElementById('carousel-main-image');
  if (mainDisplay) {
    mainDisplay.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    mainDisplay.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 35) {
        updateCarouselDisplay(currentCarouselIndex + 1);
      } else if (touchEndX - touchStartX > 35) {
        updateCarouselDisplay(currentCarouselIndex - 1);
      }
    }, { passive: true });
  }
}

/* 5. Auto-Play Homepage Project Cards */
function initCardCarousels() {
  const cardKeys = Object.keys(projectData);

  cardKeys.forEach(key => {
    const data = projectData[key];
    const imgEl = document.getElementById(`card-img-${key}`);
    const badgeEl = document.getElementById(`badge-${key}`);
    const prevBtn = document.querySelector(`[data-card-prev="${key}"]`);
    const nextBtn = document.querySelector(`[data-card-next="${key}"]`);

    if (!imgEl || !data || !data.images || data.images.length === 0) return;

    // Preload all project images for instant smooth transitions
    data.images.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    let cardIndex = 0;

    const setCardSlide = (index) => {
      if (index < 0) cardIndex = data.images.length - 1;
      else if (index >= data.images.length) cardIndex = 0;
      else cardIndex = index;

      imgEl.style.opacity = '0.4';
      setTimeout(() => {
        imgEl.src = data.images[cardIndex];
        imgEl.style.opacity = '1';
      }, 120);

      if (badgeEl) {
        badgeEl.textContent = `${cardIndex + 1} / ${data.images.length}`;
      }
    };

    // Auto-advance every 3.2 seconds
    setInterval(() => {
      setCardSlide(cardIndex + 1);
    }, 3200);

    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        setCardSlide(cardIndex - 1);
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        setCardSlide(cardIndex + 1);
      };
    }
  });
}

/* 5. Contact Form Validation & Email Dispatch */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusMsg = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const phoneInput = document.getElementById('contact-phone');
  const countryCodeSelect = document.getElementById('contact-country-code');

  // New Question Elements
  const businessTypeSelect = document.getElementById('contact-business-type');
  const customBusinessContainer = document.getElementById('custom-business-container');
  const customBusinessInput = document.getElementById('contact-custom-business');

  const timelineSelect = document.getElementById('contact-timeline');
  const customTimelineContainer = document.getElementById('custom-timeline-container');
  const customTimelineInput = document.getElementById('contact-custom-timeline');

  const budgetSelect = document.getElementById('contact-budget');
  const customBudgetContainer = document.getElementById('custom-budget-container');
  const customBudgetInput = document.getElementById('contact-custom-budget');

  const requirementsInput = document.getElementById('contact-requirements');
  const notesInput = document.getElementById('contact-notes');

  // File Upload Elements
  const fileInput = document.getElementById('contact-file');
  const fileUploadZone = document.getElementById('file-upload-zone');
  const filePreviewList = document.getElementById('file-preview-list');
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
  const MAX_FILES = 3;
  const ALLOWED_EXTENSIONS = ['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt','.csv','.png','.jpg','.jpeg','.gif','.svg','.zip','.rar','.fig','.ai','.psd','.eps'];
  let selectedFiles = [];

  if (!form) return;

  // File Upload Logic
  if (fileInput && fileUploadZone && filePreviewList) {
    const updateFilePreview = () => {
      if (selectedFiles.length === 0) {
        filePreviewList.classList.add('hidden');
        filePreviewList.innerHTML = '';
        return;
      }
      filePreviewList.classList.remove('hidden');
      filePreviewList.innerHTML = selectedFiles.map((file, idx) => {
        const sizeKB = (file.size / 1024).toFixed(1);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const sizeStr = file.size >= 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
        const isOverSize = file.size > MAX_FILE_SIZE;
        return `
          <div class="flex items-center justify-between px-3 py-2 rounded-lg border ${isOverSize ? 'border-red-300 bg-red-50/50' : 'border-outline-variant/30 bg-surface-container-lowest'} text-sm">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-base ${isOverSize ? 'text-red-500' : 'text-primary'}">description</span>
              <span class="truncate text-on-surface font-medium max-w-[180px] sm:max-w-[280px]">${file.name}</span>
              <span class="text-xs text-on-surface-variant/60 flex-shrink-0">(${sizeStr})</span>
              ${isOverSize ? '<span class="text-xs text-red-600 font-semibold flex-shrink-0">Too large</span>' : ''}
            </div>
            <button type="button" data-remove-idx="${idx}" class="file-remove-btn p-1 text-on-surface-variant hover:text-red-600 transition-colors flex-shrink-0" aria-label="Remove file">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        `;
      }).join('');

      // Bind remove buttons
      filePreviewList.querySelectorAll('.file-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.removeIdx, 10);
          selectedFiles.splice(idx, 1);
          updateFilePreview();
        });
      });
    };

    const addFiles = (files) => {
      for (const file of files) {
        if (selectedFiles.length >= MAX_FILES) {
          showStatus(`You can upload a maximum of ${MAX_FILES} files.`, 'error');
          break;
        }
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          showStatus(`File "${file.name}" has an unsupported format. Allowed: PDF, DOCX, XLSX, PPTX, Images, ZIP, Figma, AI, PSD.`, 'error');
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          showStatus(`File "${file.name}" exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`, 'error');
          continue;
        }
        // Avoid duplicates
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) continue;
        selectedFiles.push(file);
      }
      updateFilePreview();
    };

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) addFiles(Array.from(fileInput.files));
      fileInput.value = ''; // Reset so same file can be re-selected
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(evt => {
      fileUploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        fileUploadZone.classList.add('border-primary', 'bg-primary/10');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      fileUploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        fileUploadZone.classList.remove('border-primary', 'bg-primary/10');
      });
    });
    fileUploadZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
    });
  }

  // Toggle custom input for 1. Business Type
  if (businessTypeSelect && customBusinessContainer) {
    businessTypeSelect.addEventListener('change', () => {
      if (businessTypeSelect.value === 'Other') {
        customBusinessContainer.classList.remove('hidden');
        if (customBusinessInput) customBusinessInput.focus();
      } else {
        customBusinessContainer.classList.add('hidden');
      }
    });
  }

  // Toggle custom input for 2. Expected Timeline
  if (timelineSelect && customTimelineContainer) {
    timelineSelect.addEventListener('change', () => {
      if (timelineSelect.value === 'Custom') {
        customTimelineContainer.classList.remove('hidden');
        if (customTimelineInput) customTimelineInput.focus();
      } else {
        customTimelineContainer.classList.add('hidden');
      }
    });
  }

  // Toggle custom input for 3. Estimated Budget
  if (budgetSelect && customBudgetContainer) {
    budgetSelect.addEventListener('change', () => {
      if (budgetSelect.value === 'Custom') {
        customBudgetContainer.classList.remove('hidden');
        if (customBudgetInput) customBudgetInput.focus();
      } else {
        customBudgetContainer.classList.add('hidden');
      }
    });
  }

  // Enforce numbers-only and 10-digit limit on phone input
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      // Strip any non-digit character and cap at 10 digits
      this.value = this.value.replace(/\D/g, '').slice(0, 10);
    });

    phoneInput.addEventListener('keypress', function (e) {
      // Disallow non-numeric keys except controls
      if (e.key && !/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    });

    phoneInput.addEventListener('paste', function (e) {
      e.preventDefault();
      const pasteText = (e.clipboardData || window.clipboardData).getData('text') || '';
      const cleanDigits = pasteText.replace(/\D/g, '').slice(0, 10);
      this.value = cleanDigits;
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const countryCode = countryCodeSelect ? countryCodeSelect.value : '+91';
    const rawPhoneDigits = phoneInput ? phoneInput.value.replace(/\D/g, '').trim() : '';
    const phone = rawPhoneDigits ? `${countryCode} ${rawPhoneDigits}` : '';
    const businessNameInput = document.getElementById('contact-business-name');
    const businessName = businessNameInput ? businessNameInput.value.trim() : '';

    // 1. Business Type
    const businessTypeValue = businessTypeSelect ? businessTypeSelect.value : '';
    const customBusinessValue = customBusinessInput ? customBusinessInput.value.trim() : '';
    const finalBusinessType = (businessTypeValue === 'Other') ? customBusinessValue : businessTypeValue;

    // 2. Expected Timeline
    const timelineValue = timelineSelect ? timelineSelect.value : '';
    const customTimelineValue = customTimelineInput ? customTimelineInput.value.trim() : '';
    const finalTimeline = (timelineValue === 'Custom') ? customTimelineValue : timelineValue;

    // 3. Estimated Budget
    const budgetValue = budgetSelect ? budgetSelect.value : '';
    const customBudgetValue = customBudgetInput ? customBudgetInput.value.trim() : '';
    const finalBudget = (budgetValue === 'Custom') ? customBudgetValue : budgetValue;

    // 4. Requirements (Mandatory)
    const requirements = requirementsInput ? requirementsInput.value.trim() : '';

    // 5. Additional Notes (Optional - can be empty)
    const additionalNotes = notesInput ? notesInput.value.trim() : '';

    // Required Fields Validation
    if (!name || !email || !rawPhoneDigits || !businessName || !businessTypeValue || !timelineValue || !budgetValue || !requirements) {
      showStatus('Please fill in all required fields (Name, Email, Phone, Business Name, Business Type, Timeline, Budget, and Requirements).', 'error');
      return;
    }

    if (rawPhoneDigits.length !== 10) {
      showStatus('Please enter a valid 10-digit phone number.', 'error');
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (businessTypeValue === 'Other' && !finalBusinessType) {
      showStatus('Please specify your custom business type.', 'error');
      if (customBusinessInput) customBusinessInput.focus();
      return;
    }

    if (timelineValue === 'Custom' && !finalTimeline) {
      showStatus('Please enter your custom expected timeline.', 'error');
      if (customTimelineInput) customTimelineInput.focus();
      return;
    }

    if (budgetValue === 'Custom' && !finalBudget) {
      showStatus('Please enter your custom Estimated Budget.', 'error');
      if (customBudgetInput) customBudgetInput.focus();
      return;
    }

    if (!validateEmail(email)) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }

    // UI Loading State Elements & Helpers
    const formLoading = document.getElementById('form-loading');
    const formLoadingText = document.getElementById('form-loading-text');
    const originalBtnText = '<span class="btn-label">Send Message</span>';

    const startLoadingState = (btnLabel, statusText) => {
      submitBtn.disabled = true;
      submitBtn.classList.add('btn-submitting');
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-95" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>${btnLabel}</span>
        <span class="loading-dots ml-1"><span>.</span><span>.</span><span>.</span></span>
      `;
      if (formLoading) {
        if (formLoadingText && statusText) formLoadingText.textContent = statusText;
        formLoading.classList.remove('hidden');
      }
    };

    const stopLoadingState = () => {
      submitBtn.disabled = false;
      submitBtn.classList.remove('btn-submitting');
      submitBtn.innerHTML = originalBtnText;
      if (formLoading) {
        formLoading.classList.add('hidden');
      }
    };

    const fullMessage = `Requirements:\n${requirements}` + (additionalNotes ? `\n\nAdditional Notes:\n${additionalNotes}` : '');

    const payload = {
      name,
      email,
      phone,
      businessName,
      service: finalBusinessType || 'Custom Project',
      businessType: finalBusinessType,
      timeline: finalTimeline,
      budget: finalBudget,
      requirements,
      additionalNotes,
      message: fullMessage
    };

    // Build request data (Use FormData if files attached, otherwise clean JSON)
    const hasFiles = typeof selectedFiles !== 'undefined' && selectedFiles.length > 0;
    let requestBody;
    let requestHeaders = {};

    // Start sleek loading animation with dynamic text
    const btnLabel = hasFiles ? 'Uploading & Sending' : 'Sending Message';
    const statusLabel = hasFiles
      ? `Uploading ${selectedFiles.length} attachment(s) & delivering inquiry...`
      : 'Connecting & sending your inquiry to Venkat...';
    startLoadingState(btnLabel, statusLabel);

    if (hasFiles) {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });
      selectedFiles.forEach(file => formData.append('attachments', file));
      requestBody = formData;
      // Note: Browser automatically sets Content-Type to multipart/form-data with boundary
    } else {
      requestBody = JSON.stringify(payload);
      requestHeaders['Content-Type'] = 'application/json';
    }

    const recipient = 'freelancewithvenkat@gmail.com';

    const isFile = window.location.protocol === 'file:';
    const isLocal = isFile || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
    const host = (!isFile && window.location.hostname) ? window.location.hostname : 'localhost';
    const isSamePort = window.location.port === '5000' || (!isLocal && !isFile);
    const primaryUrl = isSamePort ? '/api/contact' : `http://${host}:5000/api/contact`;
    const fallbackUrl = isLocal ? `http://${host}:5001/api/contact` : 'https://personal-branding-website.onrender.com/api/contact';

    // Reset helper
    const resetAllFields = () => {
      form.reset();
      if (customBusinessContainer) customBusinessContainer.classList.add('hidden');
      if (customTimelineContainer) customTimelineContainer.classList.add('hidden');
      if (customBudgetContainer) customBudgetContainer.classList.add('hidden');
      // Clear uploaded files
      if (typeof selectedFiles !== 'undefined') selectedFiles.length = 0;
      if (filePreviewList) { filePreviewList.classList.add('hidden'); filePreviewList.innerHTML = ''; }
    };

    // Try posting to Express Backend API (Port 5000 / 5001)
    const postToBackend = (url) => {
      const fetchOpts = {
        method: 'POST',
        body: requestBody
      };
      if (Object.keys(requestHeaders).length > 0) {
        fetchOpts.headers = requestHeaders;
      }
      return fetch(url, fetchOpts).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(data.error || `Server responded with HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }
        return data;
      });
    };

    postToBackend(primaryUrl)
      .then(data => handleSuccessResponse(data, name, email, recipient, payload))
      .catch((primaryErr) => {
        // If client validation error (400 or 422), display the exact message
        if (primaryErr.status === 400 || primaryErr.status === 422) {
          stopLoadingState();
          showStatus(primaryErr.message || 'Please check your inputs and try again.', 'error');
          return;
        }

        console.warn('[CONTACT FORM] Primary endpoint failed:', primaryErr.message, 'Trying fallback...');
        // Try fallback port 5001 or cloud API
        postToBackend(fallbackUrl)
          .then(data => handleSuccessResponse(data, name, email, recipient, payload))
          .catch((fallbackErr) => {
            console.error('[CONTACT FORM] Both endpoints failed:', fallbackErr.message);
            // Mailto fallback
            stopLoadingState();
            triggerMailtoFallback(payload, recipient);
            resetAllFields();
          });
      });

    function handleSuccessResponse(data, name, email, recipient, payload) {
      stopLoadingState();
      if (data.success) {
        showStatus(`✓ Thank you for your message, ${name}! I will reach out to you within 24 hours.`, 'success');
        resetAllFields();
      } else {
        triggerMailtoFallback(payload, recipient);
        resetAllFields();
      }
    }
  });

  function triggerMailtoFallback(p, recipient) {
    const subject = encodeURIComponent(`Project Inquiry from ${p.name} (${p.businessName ? p.businessName + ' - ' : ''}${p.businessType || 'General'})`);
    const bodyText =
      `Hello Venkat,\n\n` +
      `👤 Client Name: ${p.name}\n` +
      `✉️ Email: ${p.email}\n` +
      `📞 Phone: ${p.phone || 'N/A'}\n` +
      `🏢 Business Name: ${p.businessName || 'N/A'}\n` +
      `🏢 Business Type: ${p.businessType || 'N/A'}\n` +
      `⏱️ Expected Timeline: ${p.timeline || 'N/A'}\n` +
      `💰 Estimated Budget: ${p.budget || 'N/A'}\n\n` +
      `📝 Requirements:\n${p.requirements}\n\n` +
      (p.additionalNotes ? `📌 Additional Notes:\n${p.additionalNotes}\n\n` : '') +
      `Best regards,\n${p.name}`;

    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    showStatus(`✓ Thank you, ${p.name}! Your email draft for ${recipient} has been prepared.`, 'success');
  }

  function showStatus(message, type) {
    if (!statusMsg) return;
    statusMsg.innerHTML = message;
    statusMsg.classList.remove('hidden', 'toast-slide-in', 'text-emerald-800', 'bg-emerald-100/80', 'border-emerald-300', 'text-red-800', 'bg-red-100/80', 'border-red-300');

    // Force reflow to trigger slide-in animation on every submission
    void statusMsg.offsetWidth;
    statusMsg.classList.add('toast-slide-in');

    if (type === 'success') {
      statusMsg.classList.add('text-emerald-800', 'bg-emerald-100/90', 'border', 'border-emerald-300', 'p-4', 'rounded-xl', 'text-sm', 'font-medium', 'leading-relaxed', 'shadow-sm');
    } else {
      statusMsg.classList.add('text-red-800', 'bg-red-100/90', 'border', 'border-red-300', 'p-4', 'rounded-xl', 'text-sm', 'font-medium', 'leading-relaxed', 'shadow-sm');
    }

    statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
