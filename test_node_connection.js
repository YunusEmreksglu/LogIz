const axios = require('axios');
const fs = require('fs');

async function testConnection() {
    console.log("Testing connection to Python API...");
    try {
        // Read unsw_sample.csv
        const fileContent = fs.readFileSync('./unsw_sample.csv');
        const base64Content = fileContent.toString('base64');

        console.log("Sending request to http://127.0.0.1:5000/api/analyze/upload");

        const response = await axios.post(
            'http://127.0.0.1:5000/api/analyze/upload',
            {
                file_content: base64Content,
                filename: 'unsw_sample.csv'
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        console.log("Status:", response.status);
        console.log("Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Connection Failed!");
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        } else if (error.request) {
            console.error("No response received. Is Python app running?");
        } else {
            console.error("Error:", error.message);
        }
    }
}

testConnection();
