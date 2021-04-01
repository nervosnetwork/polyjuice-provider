var express = require('express');
var app = express();
var path = require('path');

app.use(express.static(path.join(__dirname + '/static')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

const port = 3000;

app.listen(port);

console.log(`access http://localhost:${port} in your browser for testing.`);