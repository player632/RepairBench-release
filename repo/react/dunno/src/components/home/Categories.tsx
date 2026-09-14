import { Container, StyledNavLink } from './CategoriesStyles';

const Categories = () => (
  <Container>
    <StyledNavLink exact to='/' data-testid='category-tv'>
      TV SHOWS
    </StyledNavLink>

    <StyledNavLink exact to='/movie' data-testid='category-movie'>
      MOVIES
    </StyledNavLink>
  </Container>
);

export default Categories;
