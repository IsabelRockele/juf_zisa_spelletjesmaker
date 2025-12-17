window.bundelPush = function(item) {
  const bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  bundel.push(item);
  localStorage.setItem('werkbladBundel', JSON.stringify(bundel));
};
