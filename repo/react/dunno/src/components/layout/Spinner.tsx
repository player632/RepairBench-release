import { SpinnerContainer, SpinnerOverlay } from './SpinnerStyles';

const Spinner = () => (
  <SpinnerOverlay data-testid='spinner'>
    <SpinnerContainer />
  </SpinnerOverlay>
);

export default Spinner;
