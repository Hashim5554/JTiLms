# Get current date and time
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Add all changes
git add .

# Commit with timestamp
git commit -m "Auto commit: $date"

# Push to remote repository
git push origin master 