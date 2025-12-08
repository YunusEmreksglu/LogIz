const fs = require('fs');
const content = `DATABASE_URL="postgresql://postgres:logiz1240.@db.jkggoepsjxpmjwqsvkeq.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:logiz1240.@db.jkggoepsjxpmjwqsvkeq.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gizli-ve-rastgele-bir-kelime-yazin"
PYTHON_API_URL="http://localhost:8000"
PYTHON_API_KEY="python-api-icin-gizli-anahtar"
MAX_FILE_SIZE=52428800
UPLOAD_DIR="./public/uploads"
NEXT_PUBLIC_SUPABASE_URL="https://jkggoepsjxpmjwqsvkeq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZ2dvZXBzanhwbWp3cXN2a2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTM2MzYsImV4cCI6MjA4MDE2OTYzNn0.tRw1fp0if4zVG-VxPHQrt8avVyxjhEEb8s2EV7SF2FA"
`;
fs.writeFileSync('.env', content, { encoding: 'utf8' });
fs.writeFileSync('.env.local', content, { encoding: 'utf8' });
console.log('Fixed .env and .env.local');
