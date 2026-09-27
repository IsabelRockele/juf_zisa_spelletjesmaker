# Run interactively. The key is hidden, never placed in command arguments or a file.
$ErrorActionPreference = 'Stop'
Write-Host "Gebruik uitsluitend de Test API-key van Mollie-profiel Juf Zisa's spelletjesmaker."
Write-Host 'De bestaande Pro-sleutels worden niet gewijzigd.'
$readingSecureKey = Read-Host 'Mollie TEST-sleutel (invoer blijft verborgen)' -AsSecureString
$readingPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($readingSecureKey)
try {
  $readingPlainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($readingPointer)
  if ($readingPlainKey -notmatch '^test_[A-Za-z0-9]+$') { throw 'Dit is geen testsleutel. Er werd niets opgeslagen.' }
  $readingPlainKey | firebase functions:secrets:set MOLLIE_READING_TEST_KEY --project zisa-spelletjesmaker-pro --data-file -
  if ($LASTEXITCODE -ne 0) { throw 'Opslaan niet bevestigd. Controleer de Firebase-melding.' }
  Write-Host 'Testsleutel opgeslagen. Er zijn geen functies gedeployed en geen betalingen gestart.'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($readingPointer)
  $readingPlainKey = $null
  $readingSecureKey.Dispose()
}
