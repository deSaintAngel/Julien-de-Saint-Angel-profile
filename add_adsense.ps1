# Script pour ajouter Google AdSense dans index.html
$indexPath = "C:\Users\julien_orbitalis\Documents\Julien-de-Saint-Angel-profile\index.html"
$adsenseScript = @"

    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5215342224838884"
         crossorigin="anonymous"></script>
"@

# Lecture du fichier
$content = Get-Content $indexPath -Encoding UTF8 -Raw

# Recherche de la ligne og:url
if ($content -match '(<meta property="og:url" content="[^"]*">)') {
    $replacement = $matches[1] + $adsenseScript
    $newContent = $content -replace [regex]::Escape($matches[1]), $replacement
    
    # Sauvegarde
    $newContent | Set-Content $indexPath -Encoding UTF8 -NoNewline
    Write-Host "✅ Script AdSense ajouté avec succès!" -ForegroundColor Green
} else {
    Write-Host "❌ Impossible de trouver la balise og:url" -ForegroundColor Red
}
