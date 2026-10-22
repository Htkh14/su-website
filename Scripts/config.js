// Dynamische API-URL für lokale und Live-Umgebung

// Hole aktuelle Domain
const currentHost = window.location.hostname;

// Wenn lokal (z. B. LocalWP, 127.0.0.1, localhost oder .local)
if (
  currentHost.includes("127.0.0.1") ||
  currentHost.includes("localhost") ||
  currentHost.includes(".local")
) {
  // 👉 Lokale Umgebung
  window.API_BASE = "http://schachunion-schorndorf.local";
} else {
  // 👉 Live-Server
  window.API_BASE = "https://cms.schachunion-schorndorf.de";
}
