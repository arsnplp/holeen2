// Animations des sections : défilement fluide, parallaxe, apparitions au scroll, carrousels
const demarrerSections = () => {
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const site = document.querySelector('.site');
  if (!site || !window.gsap) return;

  gsap.registerPlugin(ScrollTrigger, Observer, SplitText);

  const annee = document.getElementById('annee');
  if (annee) annee.textContent = new Date().getFullYear();

  // ---------- Défilement fluide ----------
  let lenis = null;
  if (window.Lenis && !mouvementReduit) {
    lenis = new Lenis({ lerp: 0.165, wheelMultiplier: 1.25 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Les ancres passent par Lenis pour garder un défilement doux
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const cible = document.querySelector(id);
      if (!cible) return;
      ev.preventDefault();
      if (lenis) lenis.scrollTo(cible);
      else cible.scrollIntoView({ behavior: mouvementReduit ? 'auto' : 'smooth' });
    });
  });

  // ---------- Barre de progression ----------
  gsap.to('.progression__barre', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
  });

  // ---------- Boutons : lettres qui défilent au survol ----------
  document.querySelectorAll('.bouton__texte').forEach((texte) => {
    const decoupe = new SplitText(texte, { type: 'chars', charsClass: 'lettre' });
    decoupe.chars.forEach((lettre, i) => { lettre.style.transitionDelay = i * 0.01 + 's'; });
    texte.parentElement.style.lineHeight = '1.4';
    texte.style.overflow = 'hidden';
    texte.style.height = '1.4em';
  });

  // ---------- Carrousel des témoignages ----------
  (() => {
    const piste = document.getElementById('temoignages-piste');
    if (!piste) return;
    const points = document.getElementById('temoignages-points');
    const prec = document.getElementById('temoignages-prec');
    const suiv = document.getElementById('temoignages-suiv');
    const cartes = [...piste.children];

    const pas = () => cartes[1].offsetLeft - cartes[0].offsetLeft;
    const aller = (i) => piste.scrollTo({ left: i * pas(), behavior: mouvementReduit ? 'auto' : 'smooth' });

    cartes.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Témoignage ' + (i + 1));
      b.addEventListener('click', () => aller(i));
      points.append(b);
    });

    const actualiser = () => {
      const i = Math.round(piste.scrollLeft / pas());
      [...points.children].forEach((b, k) => b.classList.toggle('est-actif', k === i));
      prec.disabled = piste.scrollLeft <= 2;
      suiv.disabled = piste.scrollLeft >= piste.scrollWidth - piste.clientWidth - 2;
    };

    prec.addEventListener('click', () => aller(Math.max(0, Math.round(piste.scrollLeft / pas()) - 1)));
    suiv.addEventListener('click', () => aller(Math.round(piste.scrollLeft / pas()) + 1));
    piste.addEventListener('scroll', actualiser, { passive: true });
    actualiser();
  })();

  // ---------- Logos : défilement continu, déplaçable à la souris ----------
  (() => {
    const piste = document.getElementById('logos-piste');
    if (!piste) return;
    const panneaux = piste.querySelectorAll('.logos__panneau');
    const VITESSE = 80; // pixels par seconde
    const allure = { valeur: 1 };
    let sens = 1;
    const repos = mouvementReduit ? 0.01 : 1;

    const boucle = gsap.timeline({ repeat: -1, onReverseComplete: () => boucle.progress(1) });
    boucle.fromTo(panneaux, { xPercent: 0 }, {
      xPercent: -100,
      duration: Math.max(800, panneaux[0].offsetWidth) / VITESSE,
      ease: 'none',
    });
    boucle.timeScale(repos);

    Observer.create({
      target: piste,
      type: 'pointer,touch',
      onPress: () => piste.classList.add('est-saisie'),
      onRelease: () => piste.classList.remove('est-saisie'),
      onChangeX: (self) => {
        const elan = gsap.utils.clamp(-30, 30, -0.005 * self.velocityX);
        sens = elan < 0 ? -1 : 1;
        gsap.timeline({ onUpdate: () => boucle.timeScale(allure.valeur) })
          .to(allure, { valeur: elan, duration: 0.1 })
          .to(allure, { valeur: sens * repos, duration: 1 });
      },
    });
  })();

  // ---------- Étapes en éventail (petits écrans) ----------
  (() => {
    const groupe = document.querySelector('.processus__etapes');
    if (!groupe) return;
    const cartes = [...groupe.querySelectorAll('.etape')];
    const petitEcran = window.matchMedia('(max-width: 991px)');
    let active = 1;

    const placer = () => {
      cartes.forEach((carte, i) => {
        // Position circulaire : la carte opposée passe de l'autre côté, il y a toujours une carte à gauche et une à droite
        let pos = petitEcran.matches ? i - active : 0;
        if (pos > 1) pos -= cartes.length;
        if (pos < -1) pos += cartes.length;
        carte.style.setProperty('--pos', pos);
        carte.style.setProperty('--ecart', Math.abs(pos));
        carte.classList.toggle('etape--active', petitEcran.matches && i === active);
      });
    };

    cartes.forEach((carte, i) => carte.addEventListener('click', () => {
      if (!petitEcran.matches || i === active) return;
      active = i;
      placer();
    }));

    // Glissement au doigt (ou à la souris) : on passe à la carte voisine.
    // Le suivi se fait pendant le geste : dès que le doigt a parcouru 40 px en horizontal, on change de carte,
    // sans attendre le relâchement, que le navigateur peut avaler s'il prend le défilement.
    let departX = null, departY = null, glisse = false;
    const debut = (x, y) => { departX = x; departY = y; glisse = false; };
    const suivi = (x, y) => {
      if (departX === null || glisse || !petitEcran.matches) return;
      const dx = x - departX, dy = y - departY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      glisse = true;
      active = (active + (dx < 0 ? 1 : -1) + cartes.length) % cartes.length;
      placer();
    };
    const fin = () => { departX = null; };

    groupe.addEventListener('touchstart', (e) => debut(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    groupe.addEventListener('touchmove', (e) => suivi(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    groupe.addEventListener('touchend', fin);
    groupe.addEventListener('mousedown', (e) => debut(e.clientX, e.clientY));
    groupe.addEventListener('mousemove', (e) => { if (e.buttons) suivi(e.clientX, e.clientY); });
    groupe.addEventListener('mouseup', fin);
    groupe.addEventListener('mouseleave', fin);

    // Un tap qui suit un glissement ne doit pas re-changer de carte
    cartes.forEach((carte) => carte.addEventListener('click', (e) => { if (glisse) e.stopImmediatePropagation(); }, true));

    petitEcran.addEventListener('change', placer);
    placer();
  })();

  if (mouvementReduit) return;

  // ---------- Grands titres : chaque ligne monte depuis son masque ----------
  document.querySelectorAll('[data-lignes]').forEach((titre) => {
    new SplitText(titre, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'ligne',
      autoSplit: true,
      onSplit(decoupe) {
        return gsap.from(decoupe.lines, { yPercent: 130, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.15 });
      },
    });
  });
  if (document.querySelector('[data-apparait]')) {
    gsap.from('[data-apparait]', { autoAlpha: 0, y: 20, duration: 0.8, ease: 'power2.out', delay: 0.6, stagger: 0.12 });
  }

  // ---------- Fonds en parallaxe ----------
  document.querySelectorAll('[data-parallax]').forEach((fond) => {
    const debut = parseFloat(fond.dataset.parallaxStart ?? 0);
    const fin = parseFloat(fond.dataset.parallaxEnd ?? 20);
    gsap.fromTo(fond, { yPercent: debut }, {
      yPercent: fin,
      ease: 'none',
      scrollTrigger: { trigger: fond, start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: 2 },
    });
  });

  // Le fond du header glisse aussi légèrement
  const fondHero = document.querySelector('.hero__fond');
  if (fondHero) {
    gsap.to(fondHero, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: 2 },
    });
  }

  // ---------- Apparition en cascade ----------
  document.querySelectorAll('[data-animate="stagger-up"]').forEach((groupe) => {
    const elements = groupe.querySelectorAll('[data-animate="stagger-up-item"]');
    if (!elements.length) return;
    gsap.from(elements, {
      yPercent: 50,
      autoAlpha: 0,
      duration: 0.6,
      stagger: 0.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: groupe, start: 'top 75%', once: true },
    });
  });

  // ---------- Images : léger dézoom à l'arrivée ----------
  document.querySelectorAll('[data-animate="scale-in"]').forEach((image) => {
    gsap.from(image, {
      scale: 1.1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: image, start: 'top 40%', once: true },
    });
  });

  // ---------- Domaines : image et texte se dévoilent de haut en bas ----------
  document.querySelectorAll('.domaine').forEach((ligne) => {
    const cibles = ligne.querySelectorAll('.domaine__image, .domaine__texte');
    gsap.set(cibles, { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 0 });
    gsap.to(cibles, {
      clipPath: 'inset(0% 0% 0% 0%)',
      autoAlpha: 1,
      duration: 0.8,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: ligne, start: 'top 85%', once: true },
    });
  });

  // ---------- Phrase qui s'illumine lettre par lettre au défilement ----------
  document.querySelectorAll('[data-highlight-text]').forEach((phrase) => {
    new SplitText(phrase, {
      type: 'words, chars',
      autoSplit: true,
      onSplit(decoupe) {
        return gsap.timeline({
          // Début et fin réglables par attribut, pour caler l'effet sur la mise en page
          scrollTrigger: {
            trigger: phrase,
            start: phrase.dataset.highlightStart || 'top 90%',
            end: phrase.dataset.highlightEnd || 'center 40%',
            scrub: true,
          },
        }).from(decoupe.chars, { autoAlpha: 0.1, stagger: 0.3, ease: 'linear' });
      },
    });
  });

  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());
};

// Le découpage des textes dépend des polices : on attend qu'elles soient chargées
(document.fonts ? document.fonts.ready : Promise.resolve()).then(demarrerSections);
