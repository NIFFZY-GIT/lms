# Database migrations

This project uses plain SQL files under `db/migrations`.

How to apply (PostgreSQL):

- Ensure your DATABASE_URL is configured for the app/environment.
- Apply the SQL files in order by filename. Example PowerShell one-liner:

```
# Set env and run from repo root
$env:DATABASE_URL = "postgres://user:pass@localhost:5432/lms"; 
Get-ChildItem db/migrations/*.sql | Sort-Object Name | % { 
  Write-Host "Applying: $($_.Name)"; 
  psql $env:DATABASE_URL -f $_.FullName 
}
```

Notes:
- The migration `20250812_add_imageUrl_to_question.sql` adds `imageUrl` to `Question`.
- Question images are stored under `public/uploads/quizzes`. The APIs save files there and persist the relative path (e.g., `/uploads/quizzes/<filename>`).
- App-level validation ensures a question has either text or an image and exactly 4 answers with one correct.
