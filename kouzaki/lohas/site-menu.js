(function () {
  function placeDirectory() {
    var directory = document.querySelector('.site-directory');
    var slot = document.querySelector('[data-site-directory-slot]');
    if (directory && slot && directory.parentNode !== slot) slot.appendChild(directory);
  }

  function closeDirectory(event) {
    var directory = document.querySelector('.site-directory');
    if (!directory || !directory.open) return;
    if (event.type === 'keydown' && event.key !== 'Escape') return;
    if (event.type === 'click' && directory.contains(event.target)) return;
    directory.open = false;
  }

  document.addEventListener('click', closeDirectory);
  document.addEventListener('keydown', closeDirectory);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', placeDirectory);
  else placeDirectory();
})();
