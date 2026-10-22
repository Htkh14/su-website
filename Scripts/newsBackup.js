//########################################################
//#----------------------Termine-------------------------#
//########################################################

async function loadNextEvents() {
  const eventsLoader = document.getElementById("events-loader");
  const list = document.getElementById("next-events");
  if (!list) return;

  // Loader anzeigen, Liste ausblenden
  eventsLoader.style.display = "block";
  list.style.display = "none";

  try {
    const res = await fetch('/wp-json/wp/v2/event?per_page=100&_embed');
    const data = await res.json();

    const today = new Date();

    // Zukünftige Events sortieren und auf 5 begrenzen
    const futureEvents = data
      .map(ev => ({
        id: ev.id,
        title: ev.title.rendered,
        start: parseDMYHI(ev.acf.startdatum)
      }))
      .filter(ev => ev.start >= today)
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);

    list.innerHTML = '';

    futureEvents.forEach(ev => {
      const li = document.createElement('li');

      // Optional: Link zu Event-Seite, aktuell nur "#" da keine Detailseite
      const link = document.createElement('div');
      link.className = 'event-item';

      // Datum
      const dateStr = `${String(ev.start.getDate()).padStart(2,'0')}.${String(ev.start.getMonth()+1).padStart(2,'0')}.${ev.start.getFullYear()}`;
      const pDate = document.createElement('p');
      pDate.textContent = dateStr;
      pDate.className = 'datum';

      // Titel
      const h3 = document.createElement('h3');
      h3.innerHTML = ev.title;

      // Uhrzeit
      const timeStr = `${String(ev.start.getHours()).padStart(2,'0')}:${String(ev.start.getMinutes()).padStart(2,'0')}`;
      const pTime = document.createElement('p');
      pTime.textContent = timeStr;
      pTime.className = 'termine-time';

      // Zusammenfügen
      link.appendChild(pDate);
      link.appendChild(h3);
      link.appendChild(pTime);
      li.appendChild(link);
      list.appendChild(li);
    });

  } catch (err) {
    console.error('Fehler beim Laden der Events:', err);
    list.innerHTML = '<li>Fehler beim Laden der Termine.</li>';
  } finally {
    // Loader ausblenden, Liste anzeigen
    eventsLoader.style.display = "none";
    list.style.display = "block";
  }
}


// Hilfsfunktionen
function parseDMYHI(dateStr){
  if(!dateStr) return null;

  // Expecting format: "2025-11-19 14:20:00"
  const parts = dateStr.split(/[- :]/); // split on "-", " ", ":"
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // JS months 0-11
  const d = parseInt(parts[2], 10);
  const h = parts[3] ? parseInt(parts[3], 10) : 0;
  const i = parts[4] ? parseInt(parts[4], 10) : 0;
  const s = parts[5] ? parseInt(parts[5], 10) : 0;

  return new Date(y, m, d, h, i, s);
}

function formatDateDMY(date){
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

// Init
document.addEventListener('DOMContentLoaded', loadNextEvents);


//########################################################
//#----------------------News----------------------------#
//########################################################

async function loadLatestNews() {
  const newsLoader = document.getElementById("news-loader");
  const list = document.getElementById('news-list');
  if (!list) return;

  // Loader anzeigen, Liste ausblenden
  newsLoader.style.display = "block";
  list.style.display = "none";

  try {
    const res = await fetch('/wp-json/wp/v2/posts?per_page=5&_embed');
    const posts = await res.json();

    list.innerHTML = '';

    posts.forEach(post => {
      const li = document.createElement('li');

      const link = document.createElement('a');
      link.href = `/Sites/news_post.html?id=${post.id}`;
      link.className = 'news-item';

      // Datum
      const date = new Date(post.date);
      const dateStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth()+1).padStart(2, '0')}.${date.getFullYear()}`;
      const pDate = document.createElement('p');
      pDate.textContent = dateStr;
      pDate.className = 'news-date';

      // Titel
      const h3 = document.createElement('h3');
      h3.innerHTML = `${post.title.rendered}`;
      console.log(post);

      // Kurzbeschreibung
      const pKurz = document.createElement('p');
      let kurz = '';
      if (post.acf && post.acf.kurzbeschreibung) {
        kurz = post.acf.kurzbeschreibung;
      } else if (post.excerpt && post.excerpt.rendered) {
        // Fallback: excerpt ohne HTML-Tags
        kurz = post.excerpt.rendered.replace(/<[^>]+>/g, '').trim();
      }
      pKurz.innerHTML = kurz;
      pKurz.className = 'news-short';

      // Zusammenfügen
      link.appendChild(pDate);
      link.appendChild(h3);
      link.appendChild(pKurz);
      li.appendChild(link);
      list.appendChild(li);
    });

  } catch (err) {
    console.error('Fehler beim Laden der News:', err);
    list.innerHTML = '<li>Fehler beim Laden der News.</li>';
  } finally {
    // Loader ausblenden, Liste anzeigen
    newsLoader.style.display = "none";
    list.style.display = "block";
  }
}

document.addEventListener('DOMContentLoaded', loadLatestNews);
