//this server.js is used to run the proxy server to bypass the CORS issue
// (for the API call in 'work_in_progress_and_random_method')
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'work_in_progress_and_random_method')));
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));

app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        res.set('Content-Type', response.headers['content-type']);
        res.send(buffer);
    } catch (error) {
        res.status(500).send('Error');
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
