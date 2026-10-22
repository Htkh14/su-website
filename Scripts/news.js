// news.js
import { cachedFetch } from "./cache.js";

const NEWS_URL = `${window.API_BASE}/wp-json/wp/v2/posts?per_page=100&_embed`;
const newsListEl = document.getElementById("newsList");
const selection = document.getElementById('news-filter');
let allNews = [];
let page = 1;
let perPage = 5;
let filterValue = 'category-no-filter';

window.innerWidth > 800 ? perPage = 10 : perPage = 5;

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

async function loadNews() {
  const loader = document.getElementById('news-list-loader');
  loader.style.display = 'flex';

  const posts = await cachedFetch("news-all", NEWS_URL, {
    compareFn: (oldData, newData) => oldData.length !== newData.length
  });

  allNews = posts.sort((a,b) => new Date(b.date) - new Date(a.date));

  loader.style.display = 'none';

  const selectedValue = getQueryParam('filter');
  if (selectedValue) {
    selection.value = selectedValue;
    changeFilter();
  } else {
    renderNewsList('category-no-filter');
  }
}

// Auto-update UI when cache updates
window.addEventListener("news-all-updated", (e) => {
  allNews = e.detail.sort((a,b) => new Date(b.date) - new Date(a.date));
  renderNewsList(selection.value || 'category-no-filter');
});

function renderNewsList(newFilter){
  const start = (page-1)*perPage;
  const end = start + perPage;

  let filteredNews = [];
  if (newFilter === 'category-no-filter' || newFilter === 'no-filter') {
    filteredNews = allNews;
  } else {
    filteredNews = allNews.filter((data) => data.class_list.includes(newFilter));
  }

  let slice = filteredNews.slice(start, end);

  newsListEl.innerHTML = '';
  slice.forEach(post => {
    const li = document.createElement('li');

    let excerpt = post.acf?.kurzbeschreibung || '';

    li.innerHTML = `<div class="date">${formatDateDMY(post.date)}</div>
                    <h3>${post.title.rendered}</h3>
                    <div class="excerpt">${excerpt}</div>
                    <a class="read-more" href="/Sites/news_post.html?id=${post.id}">Weiterlesen</a>`;
    newsListEl.appendChild(li);
  });

  document.querySelectorAll('.prevPage').forEach(button => {
    button.disabled = page === 1;
  });
  document.querySelectorAll('.nextPage').forEach(button => {
    button.disabled = page*perPage >= filteredNews.length;
  });
}

document.querySelectorAll('.prevPage').forEach(button => {
  button.addEventListener('click', ()=>{
    if(page > 1){ page--; renderNewsList(filterValue); }
  });
});
document.querySelectorAll('.nextPage').forEach(button => {
  button.addEventListener('click', ()=>{
    if(page*perPage < allNews.length){ page++; renderNewsList(filterValue); }
  });
});

function changeFilter() {
  filterValue = `category-${selection.selectedOptions[0].value}`;
  page = 1;
  renderNewsList(filterValue);
}

selection.addEventListener('change', changeFilter);

document.addEventListener('DOMContentLoaded', loadNews);