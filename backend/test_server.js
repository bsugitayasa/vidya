const express = require('express');
const app = express();
app.get('/test', (req, res) => res.send('OK'));
app.listen(3005, () => console.log('Test server on 3005'));
