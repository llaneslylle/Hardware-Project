// loader.js
// Handles showing/hiding the full-screen loading overlay

(function () {
  const loader = document.getElementById("loader");
  if (!loader) return;

  // Show immediately (in case CSS/HTML load slower)
  loader.style.display = "flex";

  // Listen for a custom event from dashboard.js when everything is ready
  window.addEventListener("dashboard:ready", () => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.25s ease-out";
    setTimeout(() => {
      loader.style.display = "none";
    }, 260);
  });
})();