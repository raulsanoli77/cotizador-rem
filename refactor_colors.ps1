$files = Get-ChildItem -Path .\src -Recurse -File -Include *.tsx,*.ts
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $newContent = $content -replace 'bg-blue-', 'bg-brand-' `
                           -replace 'text-blue-', 'text-brand-' `
                           -replace 'border-blue-', 'border-brand-' `
                           -replace 'ring-blue-', 'ring-brand-' `
                           -replace 'focus:ring-blue-', 'focus:ring-brand-' `
                           -replace 'hover:bg-blue-', 'hover:bg-brand-' `
                           -replace 'hover:text-blue-', 'hover:text-brand-'
    if ($content -cne $newContent) {
        Set-Content -Path $f.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($f.FullName)"
    }
}
