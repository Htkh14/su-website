<?php
header('Content-Type: application/json; charset=utf-8');

$teamtable = isset($_GET['teamtable']) ? $_GET['teamtable'] : '';
$group = isset($_GET['group']) ? $_GET['group'] : '';
$season = isset($_GET['season']) ? $_GET['season'] : '';

if(!$teamtable || !$group){
    echo json_encode(["error"=>"teamtable oder group fehlt"]);
    exit;
}

$teamUrl = "https://svw-schach.liga.nu/cgi-bin/WebObjects/nuLigaSCHACHDE.woa/wa/teamPortrait?teamtable={$teamtable}&pageState=vorrunde&championship=Ostalb+{$season}&group={$group}";
$groupUrl = "https://svw-schach.liga.nu/cgi-bin/WebObjects/nuLigaSCHACHDE.woa/wa/groupPage?championship=Ostalb+{$season}&group={$group}";

// --- cURL Funktion ---
function fetchUrl($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // unsicher, aber notwendig auf Shared Hosting
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $data = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if($err || !$data) return false;
    return $data;
}

// Daten abrufen
$teamHtml = fetchUrl($teamUrl);
$groupHtml = fetchUrl($groupUrl);

if(!$teamHtml || !$groupHtml){
    echo json_encode(["error"=>"Daten konnten nicht geladen werden"]);
    exit;
}

// DOM parsing
$docTeam = new DOMDocument();
libxml_use_internal_errors(true);
$docTeam->loadHTML($teamHtml);
libxml_clear_errors();
$xpathTeam = new DOMXPath($docTeam);

$docGroup = new DOMDocument();
libxml_use_internal_errors(true);
$docGroup->loadHTML($groupHtml);
libxml_clear_errors();
$xpathGroup = new DOMXPath($docGroup);

function parseTable($xpath, $headerText){
    $result = [];
    $headerNodes = $xpath->query("//b[contains(text(),'$headerText')]");
    if($headerNodes->length === 0) return $result;
    $header = $headerNodes->item(0);
    $table = null;
    $parent = $header->parentNode;
    while($parent && $parent->nodeName !== 'table'){ $parent = $parent->parentNode; }
    if(!$parent || $parent->nodeName !== 'table') return $result;
    $table = $parent;
    $collect = false;
    foreach($table->getElementsByTagName('tr') as $tr){
        if(!$collect){
            if(strpos($tr->textContent, $headerText) !== false) $collect = true;
            continue;
        }
        if($tr->getElementsByTagName('b')->length > 0) break;
        $cells = $tr->getElementsByTagName('td');
        if($cells->length > 0){
            $row = [];
            foreach($cells as $td) $row[] = trim($td->textContent);
            $result[] = $row;
        }
    }
    return $result;
}

// Spieler
$stammspieler = parseTable($xpathTeam, "Stammspieler");
$ersatzspieler = parseTable($xpathTeam, "Ersatzspieler");

// Spieltermine
$matches = $xpathTeam->query("//h2[contains(text(),'Spieltermine')]/following-sibling::table[1]/tr[position()>1]");
$spiele = [];
foreach($matches as $tr){
    $cells = $tr->getElementsByTagName('td');
    if($cells->length > 0){
        $spiele[] = array_map(function($td){ return trim($td->textContent); }, iterator_to_array($cells));
    }
}

// Kreuztabelle
$crossTable = [];
$tables = $xpathGroup->query("//table[contains(@class,'cross-table')]");
if($tables->length > 0){
    $trNodes = $tables->item(0)->getElementsByTagName('tr');
    foreach($trNodes as $tr){
        $cells = $tr->getElementsByTagName('td');
        if($cells->length > 0){
            $row = [];
            foreach($cells as $td) $row[] = trim($td->textContent);
            $crossTable[] = $row;
        }
    }
}

echo json_encode([
    "stammspieler"=>$stammspieler,
    "ersatzspieler"=>$ersatzspieler,
    "spiele"=>$spiele,
    "kreuztabelle"=>$crossTable
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
