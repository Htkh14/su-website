import { cachedFetch } from "./cache.js";

//###############################################################################################################################
// Mannschafts-IDs: teamtable und group für jede Mannschaft
const season = '26%2F27';
const teams = [
    {teamtable: "1821044", group: "5877", league: "Landesliga Ostalb"},
    {teamtable: "1821063", group: "5930", league: "Bezirksstaffel Ostalb West"},
    {teamtable: "1821406", group: "5916", league: "A-Klasse Schwäbisch Gmünd"},
    {teamtable: "1823826", group: "5912", league: "Beginnerliga Schwäbisch Gmünd"},
];
// Mannschafts-IDs: teamtable und group für jede Mannschaft
//###############################################################################################################################

const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

function createTeamContent(team, container, data) {
    container.innerHTML = '';
    container.innerHTML += `<div class="teams-heading-container"><div class="placeholder">News</div><h2><a href="https://svw-schach.liga.nu/cgi-bin/WebObjects/nuLigaSCHACHDE.woa/wa/teamPortrait?teamtable=${teams[team].teamtable}&pageState=vorrunde&championship=Ostalb+${season}&group=${teams[team].group}" target="_blank">${team + 1}. Mannschaft — ${teams[team].league}</a></h2><button class="news-button button-${team + 1}">News</button></div>`;

    document.querySelector(`.button-${team + 1}`).addEventListener('click', () => {
    console.log(team + 1);
    window.location.href = `news.html?filter=${encodeURIComponent(`${team + 1}-mannschaft`)}`;
    });

    // Spieler
    const spielerWrapper = document.createElement('div');
    spielerWrapper.classList.add('table-wrapper');
    const spielerTable = document.createElement('table');
    const spielerHead = document.createElement('thead');
    spielerHead.innerHTML = `<tr>
        <th>Brett</th><th>Name, Vorname</th><th>Mglnr.</th><th>DWZ</th><th>Einsätze</th><th>Brettpunkte</th>
    </tr>`;
    spielerTable.appendChild(spielerHead);
    const spielerBody = document.createElement('tbody');

    data.stammspieler.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td'); td.textContent = cell; tr.appendChild(td);
        });
        spielerBody.appendChild(tr);
    });

    if(data.ersatzspieler.length>0){
        const trHeader = document.createElement('tr');
        trHeader.classList.add('spieler-header');
        const tdHeader = document.createElement('td'); tdHeader.colSpan=6; tdHeader.textContent='Ersatzspieler'; trHeader.appendChild(tdHeader);
        spielerBody.appendChild(trHeader);
        data.ersatzspieler.forEach(row=>{
            const tr=document.createElement('tr');
            row.forEach(cell=>{
                const td=document.createElement('td'); td.textContent=cell; tr.appendChild(td);
            });
            spielerBody.appendChild(tr);
        });
    }
    spielerTable.appendChild(spielerBody);
    spielerWrapper.appendChild(spielerTable);
    container.appendChild(spielerWrapper);


    // Kreuztabelle
    const crossWrapper = document.createElement('div');
    crossWrapper.classList.add('table-wrapper');
    const crossTable = document.createElement('table');
    crossTable.classList.add('cross-table');
    const crossHead = document.createElement('thead');
    const nCols = data.kreuztabelle.length>0?data.kreuztabelle[0].length:0;
    const titles = ["Rang","Mannschaft"];
    for(let i=2;i<nCols-4;i++) titles.push((i-1).toString());
    titles.push("Sp","MP","BP");
    crossHead.innerHTML = `<tr>${titles.map(t=>`<th>${t}</th>`).join('')}</tr>`;
    crossTable.appendChild(crossHead);

    const crossBody = document.createElement('tbody');
    data.kreuztabelle.forEach(row=>{
      const tr = document.createElement('tr');
      const cells = (row[0].trim() === '') ? row.slice(1) : row;

      cells.forEach(cell => {
          const td = document.createElement('td');
          const match = cell.match(/^(\d+,\d+)(\d+,\d+)$/);
          td.textContent = match ? match[1] + '/' + match[2] : cell;
          tr.appendChild(td);
      });
      crossBody.appendChild(tr);
    });
    crossTable.appendChild(crossBody);
    crossWrapper.appendChild(crossTable);
    container.appendChild(crossWrapper);

    // Spieltermine
    const spieleWrapper = document.createElement('div');
    spieleWrapper.classList.add('table-wrapper');
    const spieleTable = document.createElement('table');
    const spieleHead = document.createElement('thead');
    spieleHead.innerHTML = `<tr>
        <th>Datum</th><th>Heimmannschaft</th><th>Gastmannschaft</th><th>Brettpunkte</th>
    </tr>`;
    spieleTable.appendChild(spieleHead);
    const spieleBody = document.createElement('tbody');
    data.spiele.forEach(row=>{
        const tr=document.createElement('tr');
        tr.innerHTML = `<td>${row[1]||''}</td><td>${row[6]||''}</td><td>${row[7]||''}</td><td>${row[8]||''}</td>`;
        spieleBody.appendChild(tr);
    });
    spieleTable.appendChild(spieleBody);
    spieleWrapper.appendChild(spieleTable);
    container.appendChild(spieleWrapper);
}

//Tabs klicken
tabs.forEach((tab,i)=>{
    tab.addEventListener('click', ()=>{
        tabs.forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        contents.forEach(c=>c.style.display='none');
        const c = contents[i];

        // Loader anzeigen
        const loader = document.getElementById('teams-loader');
        loader.classList.remove('hidden');

        c.style.display='block';
        c.style.maxHeight='0';
        setTimeout(()=>c.style.maxHeight='2000px',10);

        if(!c.dataset.loaded){
            cachedFetch(`teams-${i}`, `/tools/team.php?teamtable=${teams[i].teamtable}&group=${teams[i].group}&season=${season}`)
                .then(data=>{
                    createTeamContent(i, c,data);
                    c.dataset.loaded=true;
                    loader.classList.add('hidden'); // Loader ausblenden
                });
        } else {
            loader.classList.add('hidden'); // Loader ausblenden, falls bereits geladen
        }
    });
});

// erster Tab automatisch öffnen
const loader = document.getElementById('teams-loader');
loader.classList.remove('hidden');
contents[0].style.display='block';
contents[0].style.maxHeight='0';
setTimeout(()=>contents[0].style.maxHeight='2000px',10);
if(!contents[0].dataset.loaded){
    cachedFetch('teams-0', `/tools/team.php?teamtable=${teams[0].teamtable}&group=${teams[0].group}&season=${season}`)
        .then(data=>{
            createTeamContent(0, contents[0],data);
            contents[0].dataset.loaded=true;
            loader.classList.add('hidden');
        });
} else {
    loader.classList.add('hidden');
}
