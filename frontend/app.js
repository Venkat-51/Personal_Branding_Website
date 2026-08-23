/**
 * Lumina Studio - Interactive Logic & Application Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollSpy();
  initRevealAnimations();
  initProjectModals();
  initContactForm();
});

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

/* 2. Scroll Spy & Active Nav Link Indicator */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  if (sections.length === 0 || navLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href').substring(1);
          if (href === activeId) {
            link.classList.add('text-primary', 'font-semibold');
            link.classList.remove('text-on-surface-variant');
          } else {
            link.classList.remove('text-primary', 'font-semibold');
            link.classList.add('text-on-surface-variant');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
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

/* 4. Interactive Project Detail Modals */
const projectData = {
  supermarket: {
    title: 'SuperMarketApp - Fresh Grocery E-Commerce',
    category: 'E-commerce / Mobile Web App',
    image: 'public/Supermarket img/5.png',
    description: 'Enables users to browse, select, and purchase fresh groceries with fast delivery through a clean, easy-to-navigate mobile shopping experience with Google Auth integration.',
    stack: ['React', 'Vite', 'Tailwind CSS', 'Google Auth API', 'Vercel'],
    link: 'https://super-market-app-neon.vercel.app/'
  },
  flowershop: {
    title: 'Flower Shop Thanjavur - Florist Platform',
    category: 'E-commerce / Florist Platform',
    image: 'public/FlowerShop/1.png',
    description: 'Handcrafted bouquets & floral decor website featuring custom bouquet configurator, WhatsApp instant order integration, same-day local delivery scheduling, and daily temple pooja floral subscriptions.',
    stack: ['JavaScript', 'HTML5', 'Modern CSS', 'WhatsApp Business API', 'Netlify'],
    link: 'https://flowershopz.netlify.app/'
  },
  sellerrocket: {
    title: 'Seller Rocket - E-Commerce Lead Funnel',
    category: 'E-Commerce / Lead Generation Platform',
    image: 'public/Seller Rocket/1.png',
    description: 'Connects businesses with expert e-commerce solutions including Amazon account management, Shopify storefront setup, and custom WordPress development through high-conversion lead generation forms.',
    stack: ['React', 'Vite', 'Node.js', 'Tailwind CSS', 'Vercel'],
    link: 'https://sellerrocket-venkateswaran.vercel.app/'
  }
};

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
        document.getElementById('modal-image').src = data.image;
        document.getElementById('modal-image').alt = data.title;

        const modalLiveLink = document.getElementById('modal-live-link');
        if (modalLiveLink) modalLiveLink.href = data.link;

        // Render Stack Chips
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
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });
}

/* 5. Contact Form Validation & Email Dispatch */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusMsg = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phoneInput = document.getElementById('contact-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const serviceSelect = document.getElementById('contact-service');
    const serviceText = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex].text : 'General Inquiry';
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      showStatus('Please fill in all required fields (Name, Email, Project Details).', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }

    // UI Loading State
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="inline-block animate-spin mr-2">↻</span> Processing Inquiry...
    `;

    const payload = {
      name,
      email,
      phone,
      service: serviceText,
      message
    };

    const recipient = 'gvenkateswaran3@gmail.com';

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
    const host = window.location.hostname || 'localhost';
    const primaryUrl = isLocal ? `${window.location.protocol}//${host}:5000/api/contact` : '/api/contact';
    const fallbackUrl = isLocal ? `${window.location.protocol}//${host}:5001/api/contact` : 'https://personal-branding-website.onrender.com/api/contact';

    // Try posting to Express Backend API (Port 5000 / 5001)
    const postToBackend = (url) => {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => res.json());
    };

    postToBackend(primaryUrl)
    .then(data => handleSuccessResponse(data, name, email, recipient, serviceText, message, phone))
    .catch(() => {
      // Try fallback port 5001
      postToBackend(fallbackUrl)
      .then(data => handleSuccessResponse(data, name, email, recipient, serviceText, message, phone))
      .catch(() => {
        // Mailto fallback
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        triggerMailtoFallback(name, email, phone, serviceText, message, recipient);
      });
    });

    function handleSuccessResponse(data, name, email, recipient, serviceText, message, phone) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      if (data.success) {
        showStatus(`✓ Thank you for your message, ${name}! I will reach out to you within 24 hours.`, 'success');
        form.reset();
      } else {
        triggerMailtoFallback(name, email, phone, serviceText, message, recipient);
      }
    }
  });

  function triggerMailtoFallback(name, email, phone, serviceText, message, recipient) {
    const subject = encodeURIComponent(`Project Inquiry from ${name} (${serviceText})`);
    const body = encodeURIComponent(`Hello Alex,\n\nName: ${name}\nSender Email: ${email}\nPhone Number: ${phone || 'N/A'}\nProject Type: ${serviceText}\n\nProject Details:\n${message}\n\nBest regards,\n${name}`);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    showStatus(`✓ Thank you, ${name}! Your email draft for ${recipient} has been prepared.`, 'success');
    form.reset();
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
