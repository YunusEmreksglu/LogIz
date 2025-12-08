const fs = require('fs');
try {
    if (fs.existsSync('.env')) fs.unlinkSync('.env');
    if (fs.existsSync('.env.local')) fs.unlinkSync('.env.local');
    console.log('Deleted .env and .env.local');
} catch (e) {
    console.error(e);
}
