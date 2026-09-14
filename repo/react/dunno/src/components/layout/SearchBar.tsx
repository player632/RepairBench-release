import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from '@/redux/store';
import { setValue, fetchTitles, resetSearch } from '@/redux/slices/searchSlice';
import { ReactComponent as SearchIcon } from '@/icons/search.svg';
import { ReactComponent as XMarkCircle } from '@/icons/x-mark-circle.svg';
import {
  Overlay,
  Container,
  InputContainer,
  Input,
  Item,
  IconWrapper,
} from './SearchBarStyles';

interface Props {
  [key: string]: React.RefObject<HTMLDivElement>;
}

const Modal: React.VFC<Props> = ({ searchIcon, mobileSearchIcon }) => {
  const outside = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();
  const titles = useSelector((state) => state.search.titles);
  const isOpen = useSelector((state) => state.search.isOpen);
  const loading = useSelector((state) => state.search.loading);
  const value = useSelector((state) => state.search.value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value) dispatch(fetchTitles(value));
    }, 500);

  }, [value, dispatch]);

  useEffect(() => {
    const handleClick = ({ target }: MouseEvent) => {
      if (
        outside.current!.contains(target as Node) ||
        searchIcon.current!.contains(target as Node) ||
        mobileSearchIcon.current!.contains(target as Node)
      ) {
        return searchInput.current!.focus();
      }
      if (isOpen) dispatch(resetSearch());
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <Overlay isOpen={isOpen} data-testid='search-overlay' />
      <div ref={outside}>
        <Container isOpen={isOpen} data-testid='search-panel'>
          <InputContainer>
            <IconWrapper>
              <SearchIcon />
            </IconWrapper>
            <Input
              type='text'
              value={value}
              ref={searchInput}
              onChange={(e) => dispatch(setValue(e.target.value))}
              data-testid='search-input'
            />
            <IconWrapper pointer onClick={() => dispatch(resetSearch())} data-testid='search-clear'>
              <XMarkCircle />
            </IconWrapper>
          </InputContainer>

          <ul data-testid='search-results'>
            {titles.length > 0 &&
              titles
                .filter((item, index) => index < 5)
                .map((item, index) => (
                  <Link
                    to={`/${item.media_type}/${item.id}`}
                    onClick={() => dispatch(resetSearch())}
                    key={item.id}
                    data-testid={`search-result-${index}`}
                  >
                    <Item>{item.original_title || item.name}</Item>
                  </Link>
                ))}

            {titles.length > 5 && (
              <Link
                to={{ pathname: `/search/${value}`, state: titles }}
                data-testid='search-display-all'
                onClick={() => dispatch(resetSearch())}
              >
                <Item style={{ fontWeight: 500 }}>DISPLAY ALL RESULTS</Item>
              </Link>
            )}

            {titles.length === 0 && !loading && (
              <Item noPointer data-testid='search-empty'>
                Sorry, we can't find what you're looking for. Try adjusting your
                search.
              </Item>
            )}
          </ul>
        </Container>
      </div>
    </>
  );
};

export default Modal;
