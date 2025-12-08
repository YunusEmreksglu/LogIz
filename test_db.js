const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:logiz1240.@db.jkggoepsjxpmjwqsvkeq.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('Connection error:', err);
        client.end();
    });
