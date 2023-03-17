import { keyframes } from '@emotion/react';
import { Keyframes } from '@emotion/serialize';
import styled from '@emotion/styled';
import { basicStyles } from './BasicCard';
import { hoverStyles } from './HoverableCard';

export const bounce = keyframes`
from {     
  transform: translateY(0);   
}
to {    
  transform: translateY(-100%);        
}
`;

interface AnimatedCardProps {
  animation: Keyframes;
}

export const AnimatedCard = styled.div`
  ${basicStyles};
  ${hoverStyles};
  & code {
    background-color: linen;
  }
  & p {
    animation: ${bounce} 4s linear infinite;
  }
  
`;
