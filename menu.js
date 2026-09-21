// Menu déroulant « Domaines » : survol à la souris, clic au doigt et au clavier
(() => {
  const survolPossible = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('.deroulant').forEach((menu) => {
    const bouton = menu.querySelector('.deroulant__bouton');
    let fermeture;

    const ouvrir = (etat) => {
      clearTimeout(fermeture);
      menu.classList.toggle('est-ouvert', etat);
      bouton.setAttribute('aria-expanded', String(etat));
    };

    bouton.addEventListener('click', () => ouvrir(!menu.classList.contains('est-ouvert')));

    if (survolPossible) {
      menu.addEventListener('pointerenter', () => ouvrir(true));
      // Petit délai : un écart de souris ne referme pas le menu
      menu.addEventListener('pointerleave', () => { fermeture = setTimeout(() => ouvrir(false), 180); });
    }

    menu.addEventListener('focusout', (ev) => { if (!menu.contains(ev.relatedTarget)) ouvrir(false); });
    document.addEventListener('pointerdown', (ev) => { if (!menu.contains(ev.target)) ouvrir(false); });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && menu.classList.contains('est-ouvert')) {
        ouvrir(false);
        bouton.focus();
      }
    });
  });
})();
