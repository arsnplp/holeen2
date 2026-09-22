// Page contact : validation et envoi des deux formulaires
const demarrerContact = () => {
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Formulaires ----------
  const MESSAGES = {
    projet: 'Merci ! Votre projet est bien arrivé. Nous vous recontactons très vite pour en parler.',
    reseau: 'Merci ! Votre proposition est bien arrivée. Nous l\'étudions et revenons vers vous rapidement.',
  };

  document.querySelectorAll('[data-formulaire]').forEach((formulaire) => {
    const etat = formulaire.querySelector('.formulaire__etat');
    const bouton = formulaire.querySelector('button[type="submit"]');

    const marquer = (champ) => {
      const bloc = champ.closest('.champ, .accord');
      if (bloc) bloc.classList.toggle('est-invalide', !champ.checkValidity());
      return champ.checkValidity();
    };

    // Le rouge disparaît dès que le champ redevient valide
    formulaire.querySelectorAll('[required]').forEach((champ) => {
      champ.addEventListener('input', () => { if (champ.closest('.est-invalide')) marquer(champ); });
      champ.addEventListener('change', () => { if (champ.closest('.est-invalide')) marquer(champ); });
    });

    const afficherEtat = (texte, erreur) => {
      etat.textContent = texte;
      etat.classList.toggle('est-erreur', !!erreur);
    };

    const afficherMerci = () => {
      const merci = document.createElement('div');
      merci.className = 'merci';
      merci.setAttribute('role', 'status');
      merci.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.5l2.8 2.8L16 9.5"/></svg>' +
        '<p class="h2"></p>';
      merci.querySelector('.h2').textContent = MESSAGES[formulaire.dataset.formulaire];
      [...formulaire.children].forEach((enfant) => { enfant.hidden = true; enfant.style.display = 'none'; });
      formulaire.append(merci);
      if (window.gsap && !mouvementReduit) gsap.from(merci.children, { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.15, ease: 'power2.out' });
    };

    formulaire.addEventListener('submit', async (ev) => {
      ev.preventDefault();

      const requis = [...formulaire.querySelectorAll('[required]')];
      const invalides = requis.filter((champ) => !marquer(champ));
      if (invalides.length) {
        afficherEtat('Il manque quelques informations : les champs en rouge sont à compléter.', true);
        invalides[0].focus();
        return;
      }

      // L'adresse de réception se règle dans l'attribut data-endpoint du formulaire
      const adresse = formulaire.dataset.endpoint;
      if (!adresse) {
        afficherEtat('Formulaire pas encore relié : aucune adresse de réception n\'est configurée, rien n\'a été envoyé.', true);
        return;
      }

      bouton.disabled = true;
      afficherEtat('Envoi en cours…');
      try {
        const reponse = await fetch(adresse, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(formulaire),
        });
        if (!reponse.ok) throw new Error('HTTP ' + reponse.status);
        afficherMerci();
      } catch (erreur) {
        bouton.disabled = false;
        afficherEtat('L\'envoi a échoué. Réessayez dans un instant, ou contactez-nous directement.', true);
      }
    });
  });
};

(document.fonts ? document.fonts.ready : Promise.resolve()).then(demarrerContact);
