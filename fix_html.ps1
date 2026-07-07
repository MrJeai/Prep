$root = Resolve-Path 'c:\Users\jeher\OneDrive\Desktop\Prep 2026\VSCode\Prep2026'
Get-ChildItem $root -Filter '*.html' -File | ForEach-Object {
  $content = [System.IO.File]::ReadAllText($_.FullName)
  $content = $content.Replace('`n', [Environment]::NewLine)
  [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.Encoding]::UTF8)
}
