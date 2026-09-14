import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeTitle } from '@/redux/slices/myListSlice';
import { ReactComponent as XMark } from '@/icons/x-mark.svg';
import { IMAGE_BASE_URL, POSTER_SIZE } from '@/src/config';
import { StyledLink, Img, Button } from './MyListPosterStyles';

const MyListPoster: React.VFC<{
  [key: string]: string;
}> = ({ mediaType, id, title, posterPath, firebaseId, userId, testIndex }) => {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);

  return (
    <StyledLink to={`/${mediaType}/${id}`} data-testid={`mylist-item-${testIndex}`}>
      <Img
        onLoad={() => setLoaded(true)}
        alt={title}
        src={`${IMAGE_BASE_URL}${POSTER_SIZE}${posterPath}`}
        fade={loaded}
      />
      <Button
        data-testid={`mylist-remove-${testIndex}`}
        onClick={() => dispatch(removeTitle(userId, firebaseId))}
      >
        <XMark />
      </Button>
    </StyledLink>
  );
};

export default MyListPoster;
