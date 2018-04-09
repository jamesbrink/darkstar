import React from "react";

import styled from 'styled-components';

const RenderPane = styled.div`
    background-color:: 000000;
`;

export default class Render extends React.Component {
    render() {
        return (
            <RenderPane id="RenderPane">
            </RenderPane>
        );
    }
}
