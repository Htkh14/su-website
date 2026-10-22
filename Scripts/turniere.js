// turniere.js
import { cachedFetch } from "./cache.js";

const NEWS_URL = `${window.API_BASE}/wp-json/wp/v2/posts?per_page=100&_embed`;

// Map tabs to their WP categories
const CATEGORY_MAP = [
  "category-stadtmeisterschaft",
  "category-vereinspokal",
  "category-blitz",
  "category-schnellschach",
  "category-schach960"
];

// Store all events globally to avoid multiple fetches
let allEvents = [];

// Utility: parse "YYYY-MM-DD HH:MM" into Date
function parseDMYHI(dateStr) {
  if (!dateStr) return null;
  const p = dateStr.split(/[- :]/);
  return new Date(
    parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]),
    parseInt(p[3] || 0), parseInt(p[4] || 0), parseInt(p[5] || 0)
  );
}

// Format Date to DD.MM.YYYY
function formatDateDMY(date) {
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  const loader = document.getElementById('tournaments-loader');

  // Fetch all events once
  async function loadAllEvents() {
    const data = await cachedFetch("events-all", `${window.API_BASE}/wp-json/wp/v2/event?per_page=100&_embed`, {
      compareFn: (oldData, newData) => oldData.length !== newData.length
    });

    if (!Array.isArray(data)) return;

    allEvents = data
      .map(ev => ({
        title: ev.title.rendered,
        start: parseDMYHI(ev.acf.startdatum)
      }))
      .filter(ev => ev.start)
      .sort((a,b)=>a.start-b.start);
  }

  // Generate HTML list of upcoming events for a tournament (case-insensitive)
  async function getUpcomingTournamentEventsHTML(tournamentName) {
    const now = new Date();
    const futureEvents = allEvents.filter(ev =>
      ev.start >= now && ev.title.toLowerCase().includes(tournamentName.toLowerCase())
    );

    if (futureEvents.length === 0) return '<ul></ul>';

    let html = '<ul>';
    futureEvents.forEach(ev => {
      html += `<li>
                 <span class="time">${formatDateDMY(ev.start)} ${String(ev.start.getHours()).padStart(2,'0')}:${String(ev.start.getMinutes()).padStart(2,'0')}</span>
                 <span class="title">${ev.title}</span>
               </li>`;
    });
    html += '</ul>';
    return html;
  }

  // Load news and tables
  async function loadNews() {
    if (loader) loader.classList.remove('hidden');

    const res = await cachedFetch("news-all", NEWS_URL, {
      compareFn: (oldData, newData) => oldData.length !== newData.length
    });

    if (!Array.isArray(res) || res.length === 0) return;

    // Loop through each category
    for (let i = 0; i < CATEGORY_MAP.length; i++) {
      const category = CATEGORY_MAP[i];
      const categoryPosts = res.filter(post =>
        Array.isArray(post.class_list) && post.class_list.includes(category)
      );
      if (!categoryPosts.length) continue;

      const contentDiv = document.getElementById(`tournament-${i}`);
      if (!contentDiv) continue;

      contentDiv.innerHTML = "";

      // Stadtmeisterschaft special behavior
      if (category === "category-stadtmeisterschaft") {
        const ergebnissePost = categoryPosts
          .filter(p => p.title?.rendered?.toLowerCase().includes("ergebnisse"))
          .reduce((newest, current) =>
            !newest || new Date(current.date) > new Date(newest.date) ? current : newest, null
          );

        const paarungenPost = categoryPosts
          .filter(p => p.title?.rendered?.toLowerCase().includes("paarungen"))
          .reduce((newest, current) =>
            !newest || new Date(current.date) > new Date(newest.date) ? current : newest, null
          );

        const grid = document.createElement("div");
        grid.className = "table-grid";
        grid.classList.add("grid-stadtmeisterschaft");
        contentDiv.appendChild(grid);

        const tabelle = document.createElement("div");
        const paarungen = document.createElement("div");
        const termine = document.createElement("div");
        termine.className = "events-container";
        grid.appendChild(tabelle);
        grid.appendChild(paarungen);
        grid.appendChild(termine);

        if (ergebnissePost?.content?.rendered) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(ergebnissePost.content.rendered, "text/html");
          const tables = Array.from(doc.querySelectorAll("table"));
          if (tables.length) {
            const lastTable = tables[tables.length - 1];
            const heading = document.createElement("h3");
            heading.textContent = "Aktuelle Tabelle";
            tabelle.appendChild(heading);

            const wrapper = document.createElement("div");
            wrapper.className = "table-wrapper";
            wrapper.appendChild(lastTable.cloneNode(true));
            tabelle.appendChild(wrapper);
          }
        }

        if (paarungenPost?.content?.rendered) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(paarungenPost.content.rendered, "text/html");
          const tables = Array.from(doc.querySelectorAll("table"));
          if (tables.length) {
            const lastTable = tables[tables.length - 1];
            const heading = document.createElement("h3");
            heading.textContent = "Nächste Runde";
            paarungen.appendChild(heading);

            const wrapper = document.createElement("div");
            wrapper.className = "table-wrapper";
            wrapper.appendChild(lastTable.cloneNode(true));
            paarungen.appendChild(wrapper);
          }
        }

        const heading = document.createElement("h3");
        heading.textContent = "Termine";
        termine.appendChild(heading);

        // Fetch and append upcoming events
        const eventsHTML = await getUpcomingTournamentEventsHTML("Stadtmeisterschaft");
        const eventsContainer = document.createElement("div");
        eventsContainer.className = "events-list";
        eventsContainer.innerHTML = eventsHTML;
        termine.appendChild(eventsContainer);

        const button = document.createElement("button");
        button.className = `news-button${category.split("-")[1]}`;
        button.classList.add("news-button");
        button.textContent = "Zu den News";
        termine.appendChild(button);
        button.addEventListener('click', () => {
          window.location.href = `news.html?filter=${encodeURIComponent(category.split("-")[1])}`;
        });
        contentDiv.dataset.loaded = "true";
        continue;
      }

      // Default behavior for other categories
      const newestPost = categoryPosts.reduce((newest, current) =>
        new Date(current.date) > new Date(newest.date) ? current : newest
      );

      const html = newestPost.content?.rendered;
      if (!html) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const tables = Array.from(doc.querySelectorAll("table"));
      if (!tables.length) continue;

      const grid = document.createElement("div");
      grid.className = "table-grid";
      contentDiv.appendChild(grid);

      const tabelle = document.createElement("div");
      const termine = document.createElement("div");
      termine.className = "events-container";
      grid.appendChild(tabelle);
      grid.appendChild(termine);

      const lastTable = tables[tables.length - 1];
      const heading1 = document.createElement("h3");
      heading1.textContent = "Aktuelle Tabelle";
      tabelle.appendChild(heading1);

      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      wrapper.appendChild(lastTable.cloneNode(true));
      tabelle.appendChild(wrapper);

      const heading2 = document.createElement("h3");
      heading2.textContent = "Termine";
      termine.appendChild(heading2);

      // Determine tournament name for events
      let tournamentName = "";
      switch(category) {
        case "category-vereinspokal": tournamentName = "Vereinspokal"; break;
        case "category-blitz": tournamentName = "Blitz"; break;
        case "category-schnellschach": tournamentName = "Schnellschach"; break;
        case "category-schach960": tournamentName = "Schach960"; break;
      }

      const eventsHTML = await getUpcomingTournamentEventsHTML(tournamentName);
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "events-list";
      eventsContainer.innerHTML = eventsHTML;
      termine.appendChild(eventsContainer);

      const button = document.createElement("button");
      button.className = `news-button${category.split("-")[1]}`;
      button.classList.add("news-button");
      button.textContent = "Zu den News";
      termine.appendChild(button);
      button.addEventListener('click', () => {
        window.location.href = `news.html?filter=${encodeURIComponent(category.split("-")[1])}`;
      });

      contentDiv.dataset.loaded = "true";
    }

    if (loader) loader.classList.add('hidden');
  }

  // Tab click system
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(c => c.style.display = 'none');
      const c = contents[i];
      if (!c) return;

      if (loader) loader.classList.remove('hidden');
      c.style.display = 'block';
      if (loader) loader.classList.add('hidden');
    });
  });

  // Open first tab automatically
  if (contents[0]) {
    if (loader) loader.classList.remove('hidden');
    contents[0].style.display = 'block';
    if (loader) loader.classList.add('hidden');
  }
  // Initialize
  loadAllEvents().then(loadNews);
});
