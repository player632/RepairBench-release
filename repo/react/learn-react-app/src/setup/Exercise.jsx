import React from 'react';
import styled from 'styled-components';
import Solution from './Solution';

const Container = styled.div`
    display: flex;
`;

const SolutionContainer = styled.div`
    margin: 5px;
    width: 50%;
    min-height: 100px;
`;

const SolutionTitle = styled.div`
    padding-bottom: 10px;
    font-size: 0.9rem;
`;

const Exercise = props => {
    const {
      exercise: { location, solutionLocation }
    } = props;
    return (
        <Container>
            <SolutionContainer data-testid="exercise-pane-yours">
                <SolutionTitle data-testid="exercise-title-yours">Your Solution: ({solutionLocation})</SolutionTitle>
                <Solution location={location} />
            </SolutionContainer>
            <div style={{ margin: 5 }} />
            <SolutionContainer data-testid="exercise-pane-target">
                <SolutionTitle data-testid="exercise-title-target">Target Solution: ({location})</SolutionTitle>
                <Solution location={solutionLocation} finalSolution />
            </SolutionContainer>
        </Container>
    );
};

export default Exercise;
