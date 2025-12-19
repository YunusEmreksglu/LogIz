const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:logiz1240.@db.jkggoepsjxpmjwqsvkeq.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function checkData() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const threatsRes = await client.query('SELECT count(*) FROM threats');
        console.log('Threats count:', threatsRes.rows[0].count);

        const analysisRes = await client.query('SELECT count(*) FROM analysis_results');
        console.log('Analysis count:', analysisRes.rows[0].count);

        const sampleThreats = await client.query('SELECT type FROM threats LIMIT 5');
        console.log('Sample threats:', sampleThreats.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkData();
