import { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useSelector } from '@/redux/store';
import {
  auth,
  createUserProfileDocument,
  createUserWithEmailAndPassword,
} from '@/api/firebase';
import {
  Container,
  Form,
  Heading,
  Input,
  Button,
  StyledLink,
} from './SignInStyles';

const SignUp = () => {
  const [userCredentials, setUserCredentials] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const userId = useSelector((state) => state.user.userId);
  const { displayName, email, password, confirmPassword } = userCredentials;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await createUserProfileDocument(user, { displayName });
      setUserCredentials({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = event.target;
    setUserCredentials({ ...userCredentials, [name]: value });
  };

  if (userId) return <Redirect to='/' />;

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Heading>Sign Up</Heading>
        <Input
          type='text'
          name='displayName'
          data-testid='signup-name'
          value={displayName}
          onChange={handleChange}
          placeholder='Name'
          required
        />
        <Input
          type='email'
          name='email'
          data-testid='signup-email'
          value={email}
          onChange={handleChange}
          placeholder='Email'
          autoComplete='email'
          required
        />
        <Input
          type='password'
          name='password'
          data-testid='signup-password'
          value={password}
          onChange={handleChange}
          placeholder='Password'
          autoComplete='new-password'
          required
        />
        <Input
          type='password'
          name='confirmPassword'
          data-testid='signup-confirm'
          value={confirmPassword}
          onChange={handleChange}
          placeholder='Confirm Password'
          autoComplete='new-password'
          required
        />
        <Button type='submit' data-testid='signup-submit'>Sign Up</Button>
        <StyledLink to='/signin'>Already have an account? Sign in</StyledLink>
      </Form>
    </Container>
  );
};

export default SignUp;
