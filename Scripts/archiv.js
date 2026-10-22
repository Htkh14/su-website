// news.js
const newsListEl = document.getElementById("newsList");
const selection = document.getElementById('news-filter');
let perPage = window.innerWidth > 800 ? 10 : 5;
let currentPage = 1;
let totalPages = 1;
let currentCategory = null;

function formatDateDMY(dateStr){
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function getNewsUrl(page = 1, perPage = 10, category = null){
  let url = `${window.API_BASE}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`;
  if(category) url += `&categories=${category}`;
  return url;
}

async function loadNews(page = 1, category = null){
  const loader = document.getElementById('news-list-loader');
  loader.style.display = 'flex';

  try {
    const response = await fetch(getNewsUrl(page, perPage, category));
    if(!response.ok) throw new Error("No more posts");

    const posts = await response.json();
    totalPages = parseInt(response.headers.get('X-WP-TotalPages')) || 1;
    currentPage = page;

    renderNewsList(posts, currentPage, totalPages);
  } catch (error) {
    console.error(error);
    newsListEl.innerHTML = "<li>Keine weiteren Beiträge.</li>";
    document.querySelectorAll('.prevPage, .nextPage').forEach(button => button.disabled = true);
  }

  loader.style.display = 'none';
}

function renderNewsList(posts, page, totalPages){
  newsListEl.innerHTML = '';

  posts.forEach(post => {
    const li = document.createElement('li');
    let excerpt = post.acf?.kurzbeschreibung || '';
    li.innerHTML = `<div class="date">${formatDateDMY(post.date)}</div>
                    <h3>${post.title.rendered}</h3>
                    <div class="excerpt">${excerpt}</div>
                    <a class="read-more" href="/Sites/news_post.html?id=${post.id}">Weiterlesen</a>`;
    newsListEl.appendChild(li);
  });

  document.querySelectorAll('.prevPage').forEach(button => {
    button.disabled = page <= 1;
  });
  document.querySelectorAll('.nextPage').forEach(button => {
    button.disabled = page >= totalPages;
  });
}

function changeFilter(){
  const selectedValue = selection.value;
  if(selectedValue === 'no-filter' || selectedValue === 'category-no-filter'){
    currentCategory = null;
  } else {
    currentCategory = selectedValue; // pass category ID
  }
  currentPage = 1;
  loadNews(currentPage, currentCategory);
}

// Pagination buttons
document.querySelectorAll('.prevPage').forEach(button => {
  button.addEventListener('click', () => {
    if(currentPage > 1) loadNews(currentPage - 1, currentCategory);
  });
});
document.querySelectorAll('.nextPage').forEach(button => {
  button.addEventListener('click', () => {
    loadNews(currentPage + 1, currentCategory);
  });
});

selection.addEventListener('change', changeFilter);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  const selectedValue = getQueryParam('filter');
  if(selectedValue){
    selection.value = selectedValue;
    changeFilter();
  } else {
    loadNews(currentPage, currentCategory);
  }
});
