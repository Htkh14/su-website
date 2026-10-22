// termine.js
import { cachedFetch } from "./cache.js";

const calendarEl = document.getElementById("calendar");
const monthYearEl = document.getElementById("monthYear");
const termineListEl = document.getElementById("termineList");

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let allEvents = [];
let futureEvents = [];
let page = 1;
const perPage = 10;

function parseDMYHI(dateStr){
  if(!dateStr) return null;
  const p = dateStr.split(/[- :]/);
  return new Date(
    parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]),
    parseInt(p[3]||0), parseInt(p[4]||0), parseInt(p[5]||0)
  );
}

function formatDateDMY(date){
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

async function loadEvents() {
  const loader1= document.getElementById('calendar-loader');
  const loader2= document.getElementById('calendar-list-loader');
  loader1.style.display = 'flex';
  loader2.style.display = 'flex';

  const data = await cachedFetch("events-all", `${window.API_BASE}/wp-json/wp/v2/event?per_page=100&_embed`, {
    compareFn: (oldData, newData) => oldData.length !== newData.length
  });

  loader1.style.display = 'none';
  loader2.style.display = 'none';

  allEvents = data.map(ev => ({
    title: ev.title.rendered,
    start: parseDMYHI(ev.acf.startdatum)
  })).sort((a,b)=>a.start-b.start);

  const today = new Date();
  futureEvents = allEvents.filter(ev => ev.start >= today);
}

// Auto-update when new events arrive
window.addEventListener("events-all-updated", (e) => {
  allEvents = e.detail
    .map(ev => ({ title: ev.title.rendered, start: parseDMYHI(ev.acf.startdatum) }))
    .sort((a,b)=>a.start-b.start);

  const today = new Date();
  futureEvents = allEvents.filter(ev => ev.start >= today);

  renderCalendar();
  renderTermineList();
});

function showPopup(ev, x, y) {
  let popup = document.getElementById('event-popup');
  if(!popup){
    popup = document.createElement('div');
    popup.id = 'event-popup';
    document.body.appendChild(popup);
  }
  popup.innerHTML = `<strong>${ev.title}</strong><br>${formatDateDMY(ev.start)} ${String(ev.start.getHours()).padStart(2,'0')}:${String(ev.start.getMinutes()).padStart(2,'0')}`;
  popup.style.display = 'block';

  const pw = popup.offsetWidth;
  const ph = popup.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let posX = x;
  let posY = y;

  if(posX + pw > vw) posX = vw - pw - 10;
  if(posY + ph > vh) posY = vh - ph - 10;

  popup.style.left = posX+'px';
  popup.style.top = posY+'px';
}

function hidePopup(){
  const popup = document.getElementById('event-popup');
  if(popup) popup.style.display='none';
}

function renderCalendar(){
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  let firstDay = new Date(year, month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay-1;

  const totalDays = new Date(year, month+1, 0).getDate();

  let html = '<div class="calendar-grid">';
  ['Mo','Di','Mi','Do','Fr','Sa','So'].forEach(d => html += `<div class="calendar-header">${d}</div>`);

  for(let i=0;i<firstDay;i++) html += '<div class="calendar-day empty"></div>';

  for(let day=1; day<=totalDays; day++){
    const cellDate = new Date(year, month, day);
    const isToday = cellDate.toDateString() === new Date().toDateString() ? ' today' : '';

    const dayEvents = allEvents.filter(ev => ev.start.toDateString() === cellDate.toDateString());

    html += `<div class="calendar-day${isToday}"><span class="day-number">${day}</span>`;
    dayEvents.forEach(ev => html += `<div class="event" title="${ev.title}">${ev.title}</div>`);
    html += '</div>';
  }

  html += '</div>';
  calendarEl.innerHTML = html;

  const monthNames=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  monthYearEl.textContent=`${monthNames[month]} ${year}`;

  attachCalendarEventListeners();
}

function attachCalendarEventListeners() {
  document.querySelectorAll('.calendar-day .event').forEach(el => {
    const ev = allEvents.find(e => e.title === el.textContent);

    el.addEventListener('mouseenter', e => showPopup(ev, e.pageX + 10, e.pageY + 10));
    el.addEventListener('mouseleave', hidePopup);

    el.addEventListener('click', e => {
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      if (document.getElementById('event-popup')?.style.display === 'block') {
        hidePopup();
      } else {
        showPopup(ev, rect.left + window.scrollX, rect.top + window.scrollY + el.offsetHeight);
      }
    });
  });

  document.body.addEventListener('click', hidePopup);
}

function renderTermineList(){
  const start = (page-1)*perPage;
  const end = start + perPage;

  const slice = futureEvents.slice(start, end);

  termineListEl.innerHTML = '';

  slice.forEach(ev => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="time">${formatDateDMY(ev.start)} ${String(ev.start.getHours()).padStart(2,'0')}:${String(ev.start.getMinutes()).padStart(2,'0')}</span>
                    <span class="title">${ev.title}</span>`;
    termineListEl.appendChild(li);
  });

  document.getElementById('prevPage').disabled = page === 1;
  document.getElementById('nextPage').disabled = page*perPage >= futureEvents.length;
}

document.getElementById('prevMonth').addEventListener('click', ()=>{
  currentDate.setMonth(currentDate.getMonth()-1);
  renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', ()=>{
  currentDate.setMonth(currentDate.getMonth()+1);
  renderCalendar();
});
document.getElementById('monthYear').addEventListener('click', ()=>{
  currentDate = new Date();
  renderCalendar();
});
document.getElementById('prevPage').addEventListener('click', ()=>{
  if(page > 1){ page--; renderTermineList(); }
});
document.getElementById('nextPage').addEventListener('click', ()=>{
  if(page*perPage < futureEvents.length){ page++; renderTermineList(); }
});

async function initCalendar(){
  await loadEvents();
  renderCalendar();
  renderTermineList();
}

document.addEventListener('DOMContentLoaded', initCalendar);
