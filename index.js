require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/scan/:token", async (req, res) => {
    const token = req.params.token;
    const jwt = process.env.RUGCHECK_JWT;

    if (!jwt) {
        return res.status(500).json({ error: "JWT token not found in environment variables." });
    }

    console.log(`🔍 Scanning token: ${token}`);

    try {
        const response = await axios.get(`https://api.rugcheck.xyz/v1/tokens/${token}/report`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/json"
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(`❌ Error scanning token ${token}:`, error.message);
        res.status(500).json({ error: "Failed to fetch RugCheck data", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ RugCheck Proxy running on http://localhost:${PORT}`);
});
