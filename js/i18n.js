/**
 * Magic Tools Internationalization System
 * Supports: ES (default), EN, PT
 */

class I18n {
  constructor() {
    this.currentLang = 'es';
    this.translations = {};
    this.fallbackLang = 'es';
    this.availableLangs = ['es', 'en', 'pt'];
    this.basePath = this.detectBasePath();
    this.init();
  }

  // Detect if we're in a subfolder (like /MagicTools3d/)
  detectBasePath() {
    const path = window.location.pathname;
    // If URL contains the project name, use it as base
    if (path.includes('/MagicTools3d/')) {
      return '/MagicTools3d';
    }
    // Check if we're on Live Server with a subfolder
    const segments = path.split('/').filter(s => s);
    if (segments.length > 0 && !segments[0].includes('.html')) {
      return '/' + segments[0];
    }
    return '';
  }

  async init() {
    const urlLang = this.getLangFromURL();
    const storedLang = localStorage.getItem('magicTools_lang');
    const browserLang = this.getBrowserLang();
    
    this.currentLang = urlLang || storedLang || browserLang || this.fallbackLang;
    
    console.log('🔧 Base path detected:', this.basePath || '(root)');
    
    await this.loadTranslations(this.currentLang);
    this.applyToDOM();
    this.renderLanguageSelector();
    
    console.log(`🌍 I18n initialized: ${this.currentLang}`);
  }

  getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang');
  }

  getBrowserLang() {
    const lang = navigator.language || navigator.userLanguage;
    const shortLang = lang.split('-')[0];
    return this.availableLangs.includes(shortLang) ? shortLang : null;
  }

  async loadTranslations(lang) {
    if (!this.availableLangs.includes(lang)) {
      lang = this.fallbackLang;
      this.currentLang = lang;
    }
    
    // Try multiple path strategies
    const paths = [
      `${this.basePath}/locales/${lang}.json`,
      `locales/${lang}.json`,
      `./locales/${lang}.json`,
      `../locales/${lang}.json`
    ];
    
    let lastError;
    
    for (const path of paths) {
      try {
        // Clean up double slashes except for protocol
        const cleanPath = path.replace(/([^:]\/)\/+/g, "$1");
        console.log(`📝 Trying to load: ${cleanPath}`);
        
        const response = await fetch(cleanPath);
        
        if (response.ok) {
          this.translations = await response.json();
          this.currentLang = lang;
          localStorage.setItem('magicTools_lang', lang);
          this.updateURL(lang);
          document.documentElement.lang = lang;
          console.log(`✅ Loaded translations from: ${cleanPath}`);
          return;
        } else {
          console.warn(`⚠️ ${cleanPath} returned ${response.status}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to load from ${path}:`, error.message);
        lastError = error;
      }
    }
    
    // If all paths failed, use fallback translations embedded in code
    console.error('🚨 All translation paths failed, using embedded fallback');
    this.translations = this.getFallbackTranslations(lang);
    this.currentLang = lang;
  }

  // Emergency fallback translations if JSON files are missing
  getFallbackTranslations(lang) {
    const fallbacks = {
      'es': {
        meta: { brand: 'Magic Tools' },
        nav: { 
          products: 'Productos', 
          cookieCutters: 'Cortadores',
          howToBuy: 'Cómo Comprar',
          customization: 'Personalización',
          materials: 'Materiales',
          contact: 'Contacto',
          order: 'Pedir'
        },
        hero: {
          badge: 'Impresión 3D de alta precisión',
          title: 'Diseño funcional para tu cocina',
          description: 'Accesorios inteligentes para Thermomix impresos en 3D. Organiza tus utensilios, optimiza tu espacio y personaliza cada detalle con tu color favorito.',
          viewCatalog: 'Ver catálogo',
          whatsapp: 'WhatsApp'
        }
      },
      'en': {
        meta: { brand: 'Magic Tools' },
        nav: { 
          products: 'Products', 
          cookieCutters: 'Cookie Cutters',
          howToBuy: 'How to Buy',
          customization: 'Customization',
          materials: 'Materials',
          contact: 'Contact',
          order: 'Order'
        },
        hero: {
          badge: 'High precision 3D printing',
          title: 'Functional design for your kitchen',
          description: 'Smart accessories for Thermomix 3D printed. Organize your utensils, optimize your space and customize every detail with your favorite color.',
          viewCatalog: 'View catalog',
          whatsapp: 'WhatsApp'
        }
      },
      'pt': {
        meta: { brand: 'Magic Tools' },
        nav: { 
          products: 'Produtos', 
          cookieCutters: 'Cortadores',
          howToBuy: 'Como Comprar',
          customization: 'Personalização',
          materials: 'Materiais',
          contact: 'Contato',
          order: 'Pedir'
        },
        hero: {
          badge: 'Impressão 3D de alta precisão',
          title: 'Design funcional para sua cozinha',
          description: 'Acessórios inteligentes para Thermomix impressos em 3D. Organize seus utensílios, otimize seu espaço e personalize cada detalhe com sua cor favorita.',
          viewCatalog: 'Ver catálogo',
          whatsapp: 'WhatsApp'
        }
      }
    };
    return fallbacks[lang] || fallbacks['es'];
  }

  updateURL(lang) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  }

  t(key, replacements = {}) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing: ${key}`);
        return key;
      }
    }
    
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, varName) => {
        return replacements[varName] !== undefined ? replacements[varName] : match;
      });
    }
    
    return value;
  }

  applyToDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (el.hasAttribute('data-i18n-attr')) {
        const attr = el.getAttribute('data-i18n-attr');
        el.setAttribute(attr, translation);
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.innerHTML = translation;
      }
    });

    const attrElements = document.querySelectorAll('[data-i18n-title]');
    attrElements.forEach(el => {
      el.title = this.t(el.getAttribute('data-i18n-title'));
    });
  }

  renderLanguageSelector() {
    const containers = document.querySelectorAll('[data-i18n-selector]');
    
    containers.forEach(container => {
      container.innerHTML = `
        <div class="relative group">
          <button class="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium hover:border-brand-yellow transition-colors">
            <span class="w-6 h-4 overflow-hidden rounded-sm shadow-sm flex-shrink-0">${this.getFlagSVG(this.currentLang)}</span>
            <span class="hidden sm:inline">${this.getLangName(this.currentLang)}</span>
            <i data-lucide="chevron-down" class="w-4 h-4"></i>
          </button>
          <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            ${this.availableLangs.map(lang => `
              <button onclick="i18n.changeLang('${lang}')" 
                      class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl ${lang === this.currentLang ? 'bg-brand-yellow/10 text-brand-yellow font-medium' : ''}">
                <span class="w-6 h-4 overflow-hidden rounded-sm shadow-sm flex-shrink-0">${this.getFlagSVG(lang)}</span>
                <span>${this.getLangName(lang)}</span>
                ${lang === this.currentLang ? '<i data-lucide="check" class="w-4 h-4 ml-auto"></i>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  async changeLang(lang) {
    if (lang === this.currentLang) return;
    
    document.body.style.cursor = 'wait';
    
    await this.loadTranslations(lang);
    this.applyToDOM();
    this.renderLanguageSelector();
    
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { lang, translations: this.translations } 
    }));
    
    document.body.style.cursor = 'default';
  }

  getFlagSVG(lang) {
    const flags = {
      'es': `<svg viewBox="0 0 640 480" class="w-full h-full object-cover">
        <path fill="#AA151B" d="M0 0h640v480H0z"/>
        <path fill="#F1BF00" d="M0 120h640v240H0z"/>
      </svg>`,
      'en': `<svg viewBox="0 0 640 480" class="w-full h-full object-cover">
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
        <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
        <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
        <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
      </svg>`,
      'pt': `<svg viewBox="0 0 640 480" class="w-full h-full object-cover">
        <path fill="#009C3B" d="M0 0h640v480H0z"/>
        <path fill="#FFDF00" d="M320 40l240 200-240 200L80 240z"/>
        <circle fill="#002776" cx="320" cy="240" r="120"/>
        <path fill="#FFDF00" d="M320 150l10 30h30l-25 20 10 30-25-20-25 20 10-30-25-20h30z"/>
      </svg>`
    };
    return flags[lang] || '';
  }

  getLangName(lang) {
    const names = { 
      'es': 'Español', 
      'en': 'English', 
      'pt': 'Português' 
    };
    return names[lang] || lang;
  }

  formatNumber(num, options = {}) {
    const locales = { 'es': 'es-AR', 'en': 'en-GB', 'pt': 'pt-BR' };
    return new Intl.NumberFormat(locales[this.currentLang] || 'es-AR', options).format(num);
  }

  formatCurrency(amount, currency = 'ARS') {
    const locales = { 'es': 'es-AR', 'en': 'en-GB', 'pt': 'pt-BR' };
    return new Intl.NumberFormat(locales[this.currentLang] || 'es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date) {
    const locales = { 'es': 'es-AR', 'en': 'en-GB', 'pt': 'pt-BR' };
    return new Intl.DateTimeFormat(locales[this.currentLang] || 'es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
}

const i18n = new I18n();
window.i18n = i18n;
window.t = (key, replacements) => i18n.t(key, replacements);