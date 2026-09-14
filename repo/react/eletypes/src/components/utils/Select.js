import styled from "styled-components";
import Select from 'react-select';

export default styled(Select)`
.Select__control {
    min-height: 28px;
    height: 28px;
    min-width: 120px;
    width: 100%;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    background: transparent;
  }
  .Select__value-container {
    padding: 0 4px;
  }
  .Select__indicators {
    height: 28px;
  }
  .Select__dropdown-indicator {
    padding: 2px;
  }
  .Select__single-value {
    font-size: 12px;
    color: ${({ theme }) => theme.text};
  }
  .Select__control:hover {
    border-color: ${({ theme }) => theme.text};
  }

  .Select__control--is-focused {
    box-shadow: none;
    outline: none;
  }

  .Select__indicator-separator {
    display: none;
  }

  .Select__menu {
    color: ${({ theme }) => theme.text};
    background:  ${({ theme }) => theme.background};
    border: 1px solid ${({ theme }) => theme.text};
    font-size: 12px;
  }

  .Select__menu-list::-webkit-scrollbar {
    width: 6px;
  }
  .Select__menu-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .Select__menu-list::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.text};
  }

  .Select__option--is-focused {
    color: ${({ theme }) => theme.text};
    background:  ${({ theme }) => theme.background};
  }
  .Select__option--is-selected {
    color: ${({ theme }) => theme.text};
    background:  ${({ theme }) => theme.background};
  }

`;