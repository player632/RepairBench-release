import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from '@/redux/store';
import { setIsOpen } from '@/redux/slices/searchSlice';
import { ReactComponent as SearchIcon } from '@/icons/search.svg';
import { ReactComponent as SignOutIcon } from '@/icons/sign-out.svg';
import { ReactComponent as ProfileIcon } from '@/icons/profile.svg';
import { auth, signOut } from '@/api/firebase';
import {
  StyledHeader,
  LogoLink,
  Nav,
  StyledNavLink,
  Icons,
  IconWrapper,
} from './HeaderStyles';

interface Props {
  searchIcon: React.RefObject<HTMLDivElement>;
}

const Header: React.VFC<Props> = ({ searchIcon }) => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.userId);

  return (
    <StyledHeader>
      <LogoLink to='/' data-testid='header-logo'>dunno</LogoLink>

      <Nav>
        <StyledNavLink exact to='/' data-testid='header-nav-tv'>
          TV Shows
        </StyledNavLink>

        <StyledNavLink exact to='/movie' data-testid='header-nav-movies'>
          Movies
        </StyledNavLink>

        <StyledNavLink exact to='/randomizer' data-testid='header-nav-randomizer'>
          Randomizer
        </StyledNavLink>

        <StyledNavLink exact to='/my-list' data-testid='header-nav-mylist'>
          My List
        </StyledNavLink>
      </Nav>

      <Icons>
        <IconWrapper ref={searchIcon} onClick={() => dispatch(setIsOpen())} data-testid='header-search-open'>
          <SearchIcon />
        </IconWrapper>

        {userId ? (
          <IconWrapper onClick={() => signOut(auth)} data-testid='header-signout'>
            <SignOutIcon />
          </IconWrapper>
        ) : (
          <Link to='/signin' aria-label='Sign In' data-testid='header-auth'>
            <IconWrapper>
              <ProfileIcon />
            </IconWrapper>
          </Link>
        )}
      </Icons>
    </StyledHeader>
  );
};

export default Header;
