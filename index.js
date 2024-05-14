// index.js
const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const {
    GOOGLE_SERVICE_ACCOUNT_TYPE,
    GOOGLE_PROJECT_ID,
    GOOGLE_PRIVATE_KEY_ID,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_CLIENT_ID,
    GOOGLE_AUTH_URI,
    GOOGLE_TOKEN_URI,
    GOOGLE_AUTH_PROVIDER_CERT_URL,
    GOOGLE_CLIENT_CERT_URL,
    GOOGLE_UNIVERSE_DOMAIN
} = process.env;


const auth = new google.auth.GoogleAuth({
    credentials: {
        type: GOOGLE_SERVICE_ACCOUNT_TYPE,
        project_id: GOOGLE_PROJECT_ID,
        private_key_id: GOOGLE_PRIVATE_KEY_ID,
        private_key: GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        client_email: GOOGLE_CLIENT_EMAIL,
        client_id: GOOGLE_CLIENT_ID,
        auth_uri: GOOGLE_AUTH_URI,
        token_uri: GOOGLE_TOKEN_URI,
        auth_provider_x509_cert_url: GOOGLE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: GOOGLE_CLIENT_CERT_URL,
        universe_domain: GOOGLE_UNIVERSE_DOMAIN
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

const sheets = google.sheets({ version: 'v4', auth });

const keyMapping = {
    "Product": "product",
    "Target Yield": "target_yield",
    "Minimum Investment": "minimum_investment",
    "Expected Time (Months)": "expected_time_months",
    "Investment Size": "investment_size",
    "Area": "area",
    "Percentage Funded": "percentage_funded",
    "Location": "location",
    "Property Type": "property_type",
    "Title": "title",
    "Description":"description",
    "Thumbnail": "thumbnail",
    "Image1": "image1",
    "image2": "image2",
    "image3": "image3",
    "Image4": "image4",
    "Form Link": "form_link",
    "Latitude": "latitude",
    "Longitude": "longitude"
};

function mapKeys(obj, keyMap) {
    const mappedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const mappedKey = keyMap[key] || key; // Use mapped key or original key
            mappedObj[mappedKey] = obj[key];
        }
    }
    return mappedObj;
}

app.post('/api/add-response', async (req, res) => {

    try{

        console.log(req.body)

        const values = [
            ['Value1', 'Value2', 'Value3'] // Add your values here
        ];

        // Make a request to append the row to the spreadsheet
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: '1RBIi-i17Gx0vyftAVBaH_s8lkhloNPllpSVPt3YexE4', // Replace with your Google Spreadsheet ID
            range: 'RESPONSE_SHEET', // Replace with the sheet name
            valueInputOption: 'RESPONSE_SHEET',
            resource: { values }
        });

        console.log(response)

        if(response?.status == 200){
            res.json({
                success: true,
                resCode: 200,
                response: response
            });
        }else{
            res.json({
                success: false,
                resCode: response?.status,
                response: response
            });
        }


    }catch (error) {
        console.error('Error retrieving Google Sheets data:', error);
        res.status(500).json({ error: error });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const startRow = (page - 1) * pageSize + 1; // Assuming the header is in the first row
        const endRow = startRow + pageSize - 1;
        const range = `AppSheet!A${startRow}:R${endRow}`; // Adjust column range as per your data

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: '122AFX4GdjHwIod4saH8DbmPAMZIjRgAl9f7DNcyIhWk', // Replace with your Google Spreadsheet ID
            range: 'AppSheet'
        });

        let data = response.data.values;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const rowsWithData = data.filter(row => row.some(cell => cell.trim() !== ''));

        // Log skipped rows with empty columns
        const skippedRows = data.filter(row => !row.every(cell => cell.trim() !== ''));
        skippedRows.forEach(row => {
            console.log('Skipped row due to empty column:', row);
        });

        const headers = rowsWithData.shift();

        // Constructing JSON
        let jsonData = rowsWithData.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            const mappedData = mapKeys(obj, keyMapping);
            return mappedData;
        });

        jsonData =  jsonData.map((row, index) => {
            return {
                id: index + 1, // Generating a 1-based row ID
                ...row
            };
        });
        
        console.log("jsonData",jsonData)

        res.json({
            success: true,
            resCode: 200,
            totalRows: jsonData.length,
            response: jsonData
        });
        // res.json({
        //     success: true,
        //     resCode: 200,
        //     response: jsonData,
        //     pageInfo: {
        //         page,
        //         pageSize,
        //         totalRows: jsonData.length,
        //     },
        // });
    } catch (error) {
        console.error('Error retrieving Google Sheets data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
