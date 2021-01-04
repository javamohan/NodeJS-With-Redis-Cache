const express = require('express');
const fetch = require('node-fetch')
const redis = require('redis')
const app = express()

const client = redis.createClient(6379) // redis PORT is default is 6379 should not chagne.

// set response to back
function setRepos(username, repos) {
    return `<h1> ${username} has ${repos } public repos</h1>`;
}

// fetch data from GIT API
async function getRepos(req, res, next) {
    try {
        console.log("get function...")
        const {
            username
        } = req.params
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos = data.public_repos;  // fetching public repositories
        client.setex(username, 3600, repos)   // setting into redis client  with Key name: <username>
        res.send(setRepos(username, repos)) //send response to back 
    } catch (error) {
        console.log(error)
        res.status(500)
    }
}

// cache middleware, fetching from cache when get request call
function cache(req, res, next) {
    const { username } = req.params;
    client.get(username, (err, data) => {   // get cache data by using key(username)
        if (err) throw new err;
        if (data !== null) {     // if the data is not null
            res.send(setRepos(username, data))   // send that data back else next
        } else {
            next();   
        }

    })
}

// get req, checks first in cache(that is the  2nd argument, ) 
// if not found go and get from API and put it into cache and send back .
app.get('/repos/:username', cache, getRepos)   

app.listen(9000, () => {
    console.log('App running on port: 9000')
})