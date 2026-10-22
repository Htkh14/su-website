// news_post.js
import { cachedFetch } from "./cache.js";

function formatDateDMY(dateStr){
    const date = new Date(dateStr);
    const d = String(date.getDate()).padStart(2,'0');
    const m = String(date.getMonth()+1).padStart(2,'0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

function getQueryParam(param){
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function loadPost(){
    const postId = Number(getQueryParam("id"));
    if(!postId) return;

    const loader = document.getElementById("post-loader");
    loader.style.display = "flex";

    try {
        const allPosts = await cachedFetch(
            "news-all",
            `${window.API_BASE}/wp-json/wp/v2/posts?per_page=100&_embed`
        );

        const post = allPosts.find(p => p.id === postId);

        if (!post) throw new Error("Post not found in cache");

        await loadAdjacentPosts(post, allPosts);

        const authorName =
            post._embedded &&
            post._embedded.author &&
            post._embedded.author[0]?.name
                ? post._embedded.author[0].name
                : "";

        document.getElementById("dateAuthor").innerHTML =
            `Veröffentlicht am ${formatDateDMY(post.date)} von ${authorName}`;

        document.getElementById("title").innerHTML = post.title.rendered;

        document.title =
            `News – ${post.title.rendered.replace(/<[^>]+>/g, "")} – Schachunion Schorndorf`;

        let kurz = "";
        if (post.acf && post.acf.kurzbeschreibung) kurz = post.acf.kurzbeschreibung;
        document.getElementById("kurzbeschreibung").innerHTML = kurz;

        document.getElementById("content").innerHTML = post.content.rendered;

        loader.style.display = "none";

    } catch (err) {
        console.error("Fehler beim Laden des Posts:", err);
        loader.style.display = "none";
        document.getElementById("content").textContent =
            "Fehler beim Laden des Beitrags.";
    }
}

async function loadAdjacentPosts(currentPost, allPosts){
    try {
        const currentDate = new Date(currentPost.date);

        const prev = allPosts
            .filter(p => new Date(p.date) < currentDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (prev) {
            const prevLink = document.getElementById("prevPost");
            prevLink.href = `/Sites/news_post.html?id=${prev.id}`;
            prevLink.style.visibility = "visible";
        }

        const next = allPosts
            .filter(p => new Date(p.date) > currentDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        if (next) {
            const nextLink = document.getElementById("nextPost");
            nextLink.href = `/Sites/news_post.html?id=${next.id}`;
            nextLink.style.visibility = "visible";
        }

    } catch (e) {
        console.error("Fehler beim Laden angrenzender Posts (cache):", e);
    }
}

document.addEventListener("DOMContentLoaded", loadPost);
