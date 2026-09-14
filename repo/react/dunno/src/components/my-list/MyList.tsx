import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from '@/redux/store';
import { fetchTitles } from '@/redux/slices/myListSlice';
import MyListPoster from './MyListPoster';
import { Container, Heading } from './MyListStyles';

const MyList = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.userId);
  const titles = useSelector((state) => state.myList.titles);

  useEffect(() => {
    dispatch(fetchTitles(userId!));
  }, [userId, dispatch]);

  return (
    <>
      <Heading data-testid='mylist-heading'>My List</Heading>
      <Container data-testid='mylist-container'>
        {titles &&
          titles.map((title, index) => (
            <MyListPoster {...title} userId={userId!} testIndex={String(index)} key={title.firebaseId} />
          ))}
      </Container>
    </>
  );
};

export default MyList;
