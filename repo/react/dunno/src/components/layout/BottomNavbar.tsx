import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from '@/redux/store';
import { setIsOpen } from '@/redux/slices/searchSlice';
import { ReactComponent as HomeIcon } from '@/icons/home.svg';
import { ReactComponent as SearchIcon } from '@/icons/search.svg';
import { ReactComponent as FavoriteIcon } from '@/icons/favorite.svg';
import { ReactComponent as RandomizerIcon } from '@/icons/randomizer.svg';
import { ReactComponent as ProfileIcon } from '@/icons/profile.svg';
import { ReactComponent as SignOutIcon } from '@/icons/sign-out.svg';
import { auth, signOut } from '@/api/firebase';
import {
  Container,
  Space,
  Navbar,
  NavLink,
  IconWrapper,
} from './BottomNavbarStyles';

interface Props {
  searchIcon: React.RefObject<HTMLDivElement>;
}

const BottomNavbar: React.VFC<Props> = ({ searchIcon }) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const userId = useSelector((state) => state.user.userId);

  return (
    <Navbar>
      <Space />
      <Container>
        <NavLink
          to='/'
          aria-label='Home'
          data-testid='bottomnav-home'
          isActive={() => ['/', '/movie'].includes(pathname)}
        >
          <HomeIcon />
        </NavLink>

        <IconWrapper ref={searchIcon} onClick={() => dispatch(setIsOpen())} data-testid='bottomnav-search'>
          <SearchIcon />
        </IconWrapper>

        <NavLink exact to='/randomizer' aria-label='Randomizer'
          data-testid='bottomnav-randomizer'>
          <RandomizerIcon />
        </NavLink>

        <NavLink exact to='/my-list' aria-label='My list'
          data-testid='bottomnav-mylist'>
          <FavoriteIcon />
        </NavLink>

        {userId ? (
          <IconWrapper onClick={() => signOut(auth)} data-testid='bottomnav-auth'>
            <SignOutIcon />
          </IconWrapper>
        ) : (
          <NavLink
            to='/signin'
            aria-label='Sign in'
            data-testid='bottomnav-auth'
            isActive={() => ['/signin', '/signup'].includes(pathname)}
          >
            <ProfileIcon />
          </NavLink>
        )}
      </Container>
    </Navbar>
  );
};

export default BottomNavbar;
