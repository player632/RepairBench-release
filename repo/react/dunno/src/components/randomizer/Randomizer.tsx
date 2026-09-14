import { useEffect } from 'react';
import { useDispatch, shallowEqual } from 'react-redux';
import { useSelector } from '@/redux/store';
import {
  fetchGenres,
  fetchTitle,
  setLoaded,
  resetLoaded,
} from '@/redux/slices/randomizerSlice';
import PosterPng from '@/assets/poster.webp';
import useMediaQuery from '../../hooks/useMediaQuery';
import { IMAGE_BASE_URL, POSTER_SIZE, BACKDROP_SIZE } from '@/src/config';
import {
  Container,
  Background,
  Column,
  StyledLink,
  Img,
  Buttons,
  Button,
} from './RandomizerStyles';

const Randomizer = () => {
  const dispatch = useDispatch();
  const matches = useMediaQuery('(min-width: 960px)');

  const {
    genres,
    mediaType,
    poster,
    backdrop,
    id,
    name,
    title,
    poster_path,
    backdrop_path,
  } = useSelector((state) => {
    return { ...state.randomizer, ...state.randomizer.title };
  }, shallowEqual);

  useEffect(() => {
    if (genres.tv.length === 0) dispatch(fetchGenres());
  }, [genres.tv.length, dispatch]);

  useEffect(() => {
    if (mediaType) dispatch(fetchTitle(mediaType, genres));
  }, [mediaType, genres, dispatch]);

  return (
    <Container data-testid='randomizer-page'>
      {backdrop_path && matches && (
        <Background
          alt={title || name}
          src={`${IMAGE_BASE_URL}${BACKDROP_SIZE}${backdrop_path}`}
          fade={backdrop}
          onLoad={() => dispatch(setLoaded('backdrop'))}
        />
      )}
      <Column>
        <StyledLink data-testid='randomizer-poster-link' to={poster_path ? `${title ? 'tv' : 'movie'}/${id}` : `#`}>
          <Img
            data-testid='randomizer-poster'
            alt={title || name}
            src={
              poster_path
                ? `${IMAGE_BASE_URL}${POSTER_SIZE}${poster_path}`
                : PosterPng
            }
            fade={poster}
            onLoad={() => dispatch(setLoaded('poster'))}
          />
        </StyledLink>
        <Buttons>
          <Button data-testid='randomizer-tv-button' onClick={() => dispatch(resetLoaded('tv'))}>TV SHOW</Button>
          <Button data-testid='randomizer-movie-button' onClick={() => dispatch(resetLoaded('movie'))}>MOVIE</Button>
        </Buttons>
      </Column>
    </Container>
  );
};

export default Randomizer;
