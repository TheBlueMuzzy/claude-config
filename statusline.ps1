# Force UTF-8 on all output paths
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$input_data = [Console]::In.ReadToEnd()
try {
    $json = $input_data | ConvertFrom-Json
    $model = $json.model.display_name
    $pct = [double]$json.context_window.used_percentage
} catch {
    $model = "Claude"; $pct = $null
}

if (-not $model) { $model = "Claude" }

# UTF-8 StreamWriter on raw stdout — the only reliable way on Windows PS
$utf8 = New-Object System.Text.UTF8Encoding($false)
$sw = New-Object System.IO.StreamWriter([Console]::OpenStandardOutput(), $utf8)
$sw.AutoFlush = $true

if ($null -eq $pct) {
    $sw.Write("$model | CTX: --")
    $sw.Close()
    exit 0
}

# ANSI escape
$e = [char]27

# Color thresholds
if ($pct -ge 78) {
    $color = "$e[31m"         # Red
} elseif ($pct -ge 65) {
    $color = "$e[38;5;208m"   # Orange
} elseif ($pct -ge 50) {
    $color = "$e[33m"         # Yellow
} else {
    $color = "$e[32m"         # Green
}
$white = "$e[37m"
$reset = "$e[0m"

# Unicode block characters (PS 5.1 compatible)
$FULL   = [char]0x2588   # Full block
$DARK   = [char]0x2593   # Dark shade
$MEDIUM = [char]0x2592   # Medium shade
$LIGHT  = [char]0x2591   # Light shade

# Dithered progress bar — 10 segments, 4 dither levels
$bar = ""
for ($i = 0; $i -lt 10; $i++) {
    $segStart = $i * 10.0
    $segEnd   = ($i + 1) * 10.0
    if ($pct -ge $segEnd) {
        $bar += $FULL
    } elseif ($pct -le $segStart) {
        $bar += $LIGHT
    } else {
        $fill = ($pct - $segStart) / 10.0
        if ($fill -ge 0.75) {
            $bar += $DARK
        } elseif ($fill -ge 0.50) {
            $bar += $MEDIUM
        } else {
            $bar += $LIGHT
        }
    }
}

$pctInt = [math]::Floor($pct)
$sw.Write("${color}CTX: $bar ${pctInt}%${reset} | ${white}${model}${reset}")
$sw.Close()
