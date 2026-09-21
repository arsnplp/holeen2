// Étincelles au clic (adaptation vanilla de ClickSpark)
(() => {
  const COULEUR = '#d9a552'; // or moyen : lisible sur fond sombre comme sur fond crème
  const TAILLE = 10;
  const RAYON = 18;
  const NOMBRE = 8;
  const DUREE = 450;

  const canvas = document.getElementById('etincelles');
  const ctx = canvas.getContext('2d');
  let etincelles = [];
  let enCours = false;

  const redimensionner = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  redimensionner();
  window.addEventListener('resize', redimensionner);

  const dessiner = (temps) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    etincelles = etincelles.filter((e) => {
      const ecoule = temps - e.debut;
      if (ecoule >= DUREE) return false;

      const t = Math.max(0, ecoule / DUREE);
      const adouci = t * (2 - t); // ease-out
      const distance = adouci * RAYON;
      const longueur = TAILLE * (1 - adouci);
      const cos = Math.cos(e.angle);
      const sin = Math.sin(e.angle);

      ctx.strokeStyle = COULEUR;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.x + distance * cos, e.y + distance * sin);
      ctx.lineTo(e.x + (distance + longueur) * cos, e.y + (distance + longueur) * sin);
      ctx.stroke();
      return true;
    });

    if (etincelles.length) {
      requestAnimationFrame(dessiner);
    } else {
      enCours = false;
    }
  };

  window.addEventListener('pointerdown', (ev) => {
    const debut = performance.now();
    for (let i = 0; i < NOMBRE; i++) {
      etincelles.push({ x: ev.clientX, y: ev.clientY, angle: (2 * Math.PI * i) / NOMBRE, debut });
    }
    if (!enCours) {
      enCours = true;
      requestAnimationFrame(dessiner);
    }
  });
})();
