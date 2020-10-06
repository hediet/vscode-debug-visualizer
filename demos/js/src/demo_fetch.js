const fetch = require("node-fetch");

fetch("https://jsonplaceholder.typicode.com/users")
    .then((response) => response.json())
    .then((json) => {
        debugger;
    });
