import React from "react";

import Title from "./Header/Title";

import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

export default class Header extends React.Component {
  handleChange(e) {
    const title = e.target.value;
    this.props.changeTitle(title);
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={10}>
            <Title title={this.props.title} />
          </Col>
          <Col md={2}>
            <div id="StatsPane" />
          </Col>
        </Row>
      </Grid>
    );
  }
}
