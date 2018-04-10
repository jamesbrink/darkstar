import 'babel-polyfill';
import React from "react";
import ReactDOM from "react-dom";

import Layout from "./components/Layout";

import visualization from './viz';
import gitHub from './core/gitHub';

const app = document.getElementById('app');
ReactDOM.render(<Layout/>, app);

var token;
/*
Place a file in this directory named gitHubToken with the contents of.
module.exports = "<YOUR TOKEN>";
*/
try {
    token = require ('./gitHubToken');
    console.log('Using GitHub Token:', token);
} catch (err) {
    console.error('Not using GitHub Token:', err);
}
let commitHistory = gitHub({owner: 'jamesbrink', repo: 'barcoded'}, token);

// Start visualization
visualization(commitHistory);