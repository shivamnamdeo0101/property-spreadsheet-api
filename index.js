// index.js
const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'cred.json');

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to your credentials JSON file
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
    "Thumbnail": "thumbnail",
    "Image1": "image1",
    "image2": "image2",
    "image3": "image3",
    "Image4": "image4",
    "Form Link": "form_link",
    "Latitude": "latitude",
    "Longitude": "longitude"
  }

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

        const data = response.data.values;

        console.log(data)

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const headers = data.shift();

        // Constructing JSON
        const jsonData = data.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });

            const mappedData = mapKeys(obj, keyMapping);


            return mappedData;
        });


        res.json({
            success: true,
            resCode: 200,
            totalRows: jsonData.length,
            response: jsonData,
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
