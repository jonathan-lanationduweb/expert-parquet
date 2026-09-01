/**
 * Sommaire d’article : génération à partir des titres et surlignage de la
 * section courante pendant la lecture.
 *
 * Balisage attendu : <nav class="toc" data-toc data-toc-scope="#article-body">
 */

export function initToc() {
  document.querySelectorAll('[data-toc]').forEach(setupToc);
}

function setupToc(root) {
  const scope = document.querySelector(root.dataset.tocScope || '#article-body');
  if (!scope) return;

  const headings = Array.from(scope.querySelectorAll('h2[id], h3[id]'));
  if (headings.length < 2) {
    root.hidden = true;
    return;
  }

  const list = root.querySelector('[data-toc-list]') || root;
  list.innerHTML = '';

  const links = headings.map((heading) => {
    const li = document.createElement('li');
    if (heading.tagName === 'H3') li.className = 'toc__sub';
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.dataset.tocLabel || heading.textContent;
    li.append(link);
    list.append(li);
    return { link, heading };
  });

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach(({ link, heading }) =>
          link.classList.toggle('is-current', heading === entry.target)
        );
      });
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
  );
  headings.forEach((heading) => observer.observe(heading));
}
