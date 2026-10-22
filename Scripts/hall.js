let tournaments = [
  "stadtmeisterschaft",
  "vereinspokal",
  "schach960",
  "tandem",
  "blitz",
  "schnellschach"
]

const cards = document.querySelectorAll('.card');
let currentIndex = 0;
function updateActiveCard() {
  cards.forEach((card, index) => {
    card.classList.toggle('is-active', index === currentIndex);
  });
}

let angle = 0;
function rotateCarousel(direction) {
  currentIndex = (currentIndex - direction + cards.length) % cards.length;
  const carousel = document.querySelector('.carousel');
  angle += direction * 60; // 360° / 6 cards
  carousel.style.transform = `rotateY(${angle}deg)`;
  updateActiveCard();
}

let startX = 0;
let isDragging = false;
updateActiveCard();

const carousel = document.querySelector('.carousel');

carousel.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  isDragging = true;
});

carousel.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  // Optional: live rotation while dragging
  let deltaX = e.touches[0].clientX - startX;
});

carousel.addEventListener('touchend', (e) => {
  if (!isDragging) return;
  const endX = e.changedTouches[0].clientX;
  const deltaX = endX - startX;

  // Swipe threshold
  if (deltaX > 50) {
    rotateCarousel(1); // Swipe right -> rotate left
  } else if (deltaX < -50) {
    rotateCarousel(-1); // Swipe left -> rotate right
  }

  isDragging = false;
});

function generateTournamentList(tournament) {
  fetch(`/data/${tournament}.csv`)
    .then(response => response.text())
    .then(csvText => {
        const ul = document.getElementById(tournament);

        const rows = csvText
        .trim()
        .split("\n")
        .slice(1)
        .map(row => row.split(","));

        rows.sort((a, b) => {
        const yearA = parseInt(a[0].split("/")[0], 10);
        const yearB = parseInt(b[0].split("/")[0], 10);
        return yearB - yearA;
        });

        rows.forEach(([year, first, second, third]) => {
        addLi(ul, year, "year");

        if (first) addLi(ul, first, "first");
        if (second) addLi(ul, second, "second");
        if (third) addLi(ul, third, "third");
        });
    })
    .catch(err => console.error("CSV load error:", err));
}

function addLi(ul, text, className) {
    const li = document.createElement("li");
    li.textContent = text;
    li.className = className;
    ul.appendChild(li);
}

tournaments.forEach(tournament => generateTournamentList(tournament));