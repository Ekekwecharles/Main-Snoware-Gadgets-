# Downloads candidate product images and tiles them into one labelled PNG for a quick visual check.
#   powershell -File scripts/catalog-import/contact-sheet.ps1 -Out sheet.png -Urls "label=url|label=url|..."
param([string]$Out, [string]$List, [int]$Height = 260)
$Urls = $List -split "\|"
Add-Type -AssemblyName System.Drawing
$tmp = Join-Path ([IO.Path]::GetTempPath()) "snoware-sheet"
New-Item -ItemType Directory -Force $tmp | Out-Null
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
$tiles = @()
$i = 0
foreach ($pair in $Urls) {
  $label, $url = $pair -split "=", 2
  $file = Join-Path $tmp "img$i"; $i++
  try {
    Invoke-WebRequest -UseBasicParsing -UserAgent $ua $url -OutFile $file -ErrorAction Stop
    $img = [System.Drawing.Image]::FromFile($file)
    $tiles += , @($label, $img, "$($img.Width)x$($img.Height)")
  } catch { $tiles += , @($label, $null, "FAILED") }
}
$tileW = 260
$cols = [Math]::Min(6, $tiles.Count)
$rows = [Math]::Ceiling($tiles.Count / $cols)
$bmp = New-Object System.Drawing.Bitmap ($cols * ($tileW + 8)), ($rows * ($Height + 40))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font "Arial", 9
$n = 0
foreach ($t in $tiles) {
  $x = ($n % $cols) * ($tileW + 8); $y = [Math]::Floor($n / $cols) * ($Height + 40)
  if ($t[1]) {
    $scale = [Math]::Min($tileW / $t[1].Width, $Height / $t[1].Height)
    $g.DrawImage($t[1], $x, $y, [int]($t[1].Width * $scale), [int]($t[1].Height * $scale))
  }
  $g.DrawString("$($t[0]) ($($t[2]))", $font, [System.Drawing.Brushes]::Red, $x, $y + $Height + 4)
  $n++
}
$bmp.Save($Out)
$g.Dispose(); $bmp.Dispose()
foreach ($t in $tiles) { if ($t[1]) { $t[1].Dispose() } }
