const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());

function getTokenAddresses() {
    const data = fs.readFileSync('tokens.json', 'utf8');
    return JSON.parse(data);
}

function saveTokenAddresses(tokens) {
    fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));
}

app.get('/api/tokens', (req, res) => {
    let tokens = getTokenAddresses();
    if (tokens.length === 0) {
        return res.status(404).send('No tokens available.');
    }
    const token = tokens.shift();
    saveTokenAddresses(tokens);
    res.json(token);
});

app.post('/api/tokens', (req, res) => {
    const newTokens= req.body;
    saveTokenAddresses(newTokens);
    res.status(201).send('Token addresses updated.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});