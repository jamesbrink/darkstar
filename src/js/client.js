import React from "react";
import ReactDOM from "react-dom";

import Layout from "./components/Layout";

import visualization from './viz';

// Start visualization
visualization();

const app = document.getElementById('app');
ReactDOM.render(<Layout/>, app);