import React from "react";

import Footer from "./Footer";
import Header from "./Header";
import Render from './Render';

export default class Layout extends React.Component {
  constructor() {
    super();
    this.state = {
      title: "DarkStar",
    };
  }

  changeTitle(title) {
    this.setState({title});
  }

  render() {
    return (
      <div>
        <Header changeTitle={this.changeTitle.bind(this)} title={this.state.title} />
        <Render />
        <Footer />
      </div>
    );
  }
}
