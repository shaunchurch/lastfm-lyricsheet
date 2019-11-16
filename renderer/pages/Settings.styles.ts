import styled from "styled-components";

export const Label = styled.label`
  display: block;
  padding-top: ${p => p.theme.padding}px;

  span {
    display: inline-block;
    width: 150px;
  }

  input {
    padding: ${p => p.theme.padding / 2}px ${p => p.theme.padding}px;
    border-radius: ${p => p.theme.radius}px;
    border: none;
  }
`;
