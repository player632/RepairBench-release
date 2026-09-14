import { Container, StyledLink, Paragraph, Heading } from './NotFoundStyles';

const NotFound = () => (
  <Container data-testid='notfound-page'>
    <Heading>404</Heading>
    <Paragraph>Oops! Something went wrong.</Paragraph>
    <StyledLink to='/'>Go Home</StyledLink>
  </Container>
);

export default NotFound;
