(function () {
  function closeDirectory(event) {
    var directory = document.querySelector('.site-directory');
    if (!directory || !directory.open) return;
    if (event.type === 'keydown' && event.key !== 'Escape') return;
    if (event.type === 'click' && directory.contains(event.target)) return;
    directory.open = false;
  }

  document.addEventListener('click', closeDirectory);
  document.addEventListener('keydown', closeDirectory);
})();
