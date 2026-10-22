// index.js
import { cachedFetch } from "./cache.js";
import { parseDMYHI } from "./utils.js";

//########################################################
//#---------------------- TERMINE ------------------------#
//########################################################

async function loadNextEvents() {
  const eventsLoader = document.getElementById("events-loader");
  const list = document.getElementById("next-events");
  if (!list) return;

  eventsLoader.style.display = "block";
  list.style.display = "none";

  try {
    const events = await cachedFetch("events-all", `${window.API_BASE}/wp-json/wp/v2/event?per_page=100&_embed`, {
      compareFn: (oldData, newData) => oldData.length !== newData.length
    });

    const today = new Date();

        events.forEach(ev => {
  const d = parseDMYHI(ev.acf.startdatum);
});

    const futureEvents = events
      .map(ev => ({
        id: ev.id,
        title: ev.title.rendered,
        start: parseDMYHI(ev.acf.startdatum)
      }))
      .filter(ev => ev.start >= today)
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);

    list.innerHTML = "";

    futureEvents.forEach(ev => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="event-item">
          <p class="datum">${formatDateDMY(ev.start)}</p>
          <h3>${ev.title}</h3>
          <p class="termine-time">${formatTimeHM(ev.start)}</p>
        </div>
      `;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Fehler beim Laden der Events:", err);
    list.innerHTML = "<li>Fehler beim Laden der Termine.</li>";
  } finally {
    eventsLoader.style.display = "none";
    list.style.display = "block";
  }
}

window.addEventListener("events-all-updated", (e) => {
  loadNextEvents();
});

//########################################################
//#---------------------- NEWS ---------------------------#
//########################################################

async function loadLatestNews() {
  const newsLoader = document.getElementById("news-loader");
  const list = document.getElementById("news-list");
  if (!list) return;

  newsLoader.style.display = "block";
  list.style.display = "none";

  try {
    let posts = await cachedFetch("news-all", `${window.API_BASE}/wp-json/wp/v2/posts?per_page=100&_embed`, {
      compareFn: (oldData, newData) => oldData.length !== newData.length
    });

    list.innerHTML = "";

    posts = posts.slice(0, 5);

    posts.forEach(post => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = `/Sites/news_post.html?id=${post.id}`;
      link.className = "news-item";

      const dateStr = formatDateDMY(new Date(post.date));

      const pDate = document.createElement("p");
      pDate.textContent = dateStr;
      pDate.className = "news-date";

      const h3 = document.createElement("h3");
      h3.innerHTML = post.title.rendered;

      const pKurz = document.createElement("p");
      let kurz = post.acf?.kurzbeschreibung || post.excerpt?.rendered.replace(/<[^>]+>/g, "").trim() || "";
      pKurz.innerHTML = kurz;
      pKurz.className = "news-short";

      link.append(pDate, h3, pKurz);
      li.appendChild(link);
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Fehler beim Laden der News:", err);
    list.innerHTML = "<li>Fehler beim Laden der News.</li>";
  } finally {
    newsLoader.style.display = "none";
    list.style.display = "block";
  }
}

window.addEventListener("news-all-updated", (e) => {
  loadLatestNews();
});

//########################################################
//#---------------------- HELPERS -----------------------#
//########################################################



function formatDateDMY(date) {
  return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()}`;
}

function formatTimeHM(date) {
  return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadNextEvents();
  loadLatestNews();
});

//########################################################
//#-------------------PERMISSION BANNER------------------#
//########################################################

const banner = document.getElementById('session-storage-banner');
const acceptBtn = document.getElementById('accept-session-storage');

// Banner ausblenden, wenn bereits akzeptiert
if (localStorage.getItem('sessionStorageAccepted')) {
  banner.style.display = 'none';
}

acceptBtn.addEventListener('click', () => {
  localStorage.setItem('sessionStorageAccepted', 'true');
  console.log('Session Storage Nutzung akzeptiert.');
  console.log(localStorage.getItem('sessionStorageAccepted'));
  banner.style.display = 'none';
  loadNextEvents();
  loadLatestNews();
});