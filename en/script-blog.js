(function () {
  'use strict';

  const gridEl = document.getElementById('blog-grid');
  const paginationEl = document.getElementById('blog-pagination');
  const relatedGridEl = document.getElementById('blog-related-grid');
  const currentSlug = document.body.dataset.blogArticle || '';
  const jsonPath = currentSlug ? '../../data/articles.json' : '../data/articles.json';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function articleUrl(slug) {
    return currentSlug ? `../${slug}/` : `./${slug}/`;
  }

  function assetPath(url) {
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return currentSlug ? `../../../${clean}` : `../../${clean}`;
  }

  function renderCard(article) {
    const href = articleUrl(article.slug);
    return `
      <article class="blog-card">
        <a class="blog-card__media" href="${href}">
          <img src="${assetPath(article.image)}" alt="${escapeHtml(article.imageAlt || article.title)}" loading="lazy" decoding="async">
        </a>
        <div class="blog-card__body">
          <p class="blog-card__category">${escapeHtml(article.category)}</p>
          <h2 class="blog-card__title"><a href="${href}">${escapeHtml(article.title)}</a></h2>
          <p class="blog-card__excerpt">${escapeHtml(article.excerpt)}</p>
          <div class="blog-card__meta">
            <time class="blog-card__date" datetime="${escapeHtml(article.date)}">${escapeHtml(article.dateFormatted)}</time>
            <div class="blog-card__link">
              <a class="btn btn--line" href="${href}">Read</a>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function getCurrentPage(totalPages) {
    const page = Number(new URLSearchParams(window.location.search).get('page') || '1');
    if (!Number.isFinite(page) || page < 1) return 1;
    if (page > totalPages) return totalPages;
    return page;
  }

  function buildPageHref(page) {
    const url = new URL(window.location.href);
    if (page <= 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(page));
    }
    return `${url.pathname}${url.search}`;
  }

  function renderPagination(totalPages, currentPage) {
    if (!paginationEl || totalPages <= 1) return;

    const items = [];

    items.push(
      currentPage > 1
        ? `<a class="blog-pagination__btn" href="${buildPageHref(currentPage - 1)}" aria-label="Previous page">←</a>`
        : `<span class="blog-pagination__btn is-disabled" aria-hidden="true">←</span>`
    );

    for (let page = 1; page <= totalPages; page += 1) {
      const isActive = page === currentPage;
      items.push(
        isActive
          ? `<span class="blog-pagination__page is-active" aria-current="page">${page}</span>`
          : `<a class="blog-pagination__page" href="${buildPageHref(page)}">${page}</a>`
      );
    }

    items.push(
      currentPage < totalPages
        ? `<a class="blog-pagination__btn" href="${buildPageHref(currentPage + 1)}" aria-label="Next page">→</a>`
        : `<span class="blog-pagination__btn is-disabled" aria-hidden="true">→</span>`
    );

    paginationEl.innerHTML = items.join('');
    paginationEl.hidden = false;
  }

  function renderIndex(articles, postsPerPage) {
    if (!gridEl) return;

    const totalPages = Math.max(1, Math.ceil(articles.length / postsPerPage));
    const currentPage = getCurrentPage(totalPages);
    const start = (currentPage - 1) * postsPerPage;
    const pageArticles = articles.slice(start, start + postsPerPage);

    gridEl.innerHTML = pageArticles.map(renderCard).join('');
    renderPagination(totalPages, currentPage);
  }

  function renderRelated(articles) {
    if (!relatedGridEl) return;

    const related = articles
      .filter((article) => article.slug !== currentSlug)
      .slice(0, 2);

    relatedGridEl.innerHTML = related.map(renderCard).join('');
  }

  fetch(jsonPath)
    .then((response) => {
      if (!response.ok) throw new Error('Failed to load articles');
      return response.json();
    })
    .then((data) => {
      const articles = [...(data.articles || [])].sort((a, b) => b.date.localeCompare(a.date));
      const postsPerPage = data.postsPerPage || 6;

      if (gridEl) {
        renderIndex(articles, postsPerPage);
      }

      if (relatedGridEl) {
        renderRelated(articles);
      }
    })
    .catch(() => {
      if (gridEl) {
        gridEl.innerHTML = '<p class="blog-index__lead">Unable to load articles. Please refresh the page.</p>';
      }
    });
})();
