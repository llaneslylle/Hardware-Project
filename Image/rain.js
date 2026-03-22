// rain.js
(function () {
  const canvas = document.getElementById("rainCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let drops = [];
  const maxDrops = 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  function createDrop() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 10 + Math.random() * 15,
      speed: 4 + Math.random() * 6,
      opacity: 0.2 + Math.random() * 0.4
    };
  }

  for (let i = 0; i < maxDrops; i++) {
    drops.push(createDrop());
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.lineCap = "round";

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      ctx.globalAlpha = d.opacity;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.len);
      ctx.stroke();

      d.y += d.speed;
      if (d.y > canvas.height) {
        drops[i] = createDrop();
        drops[i].y = -drops[i].len;
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();