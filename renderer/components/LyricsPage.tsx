import styled from '@emotion/styled';
import { css } from 'theme-ui';
import { keyframes } from '@emotion/react';

export const LyricsPage = styled.section(() =>
  css({
    variant: 'components.lyricsPage',
    height: '100vh',
    width: '100vw',
    position: 'relative',
    display: 'grid',
    video: {
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      ':after': {
        content: '""',
        backgroundColor: 'white',
      },
    },
  })
);

export const LyricsPageWrapper = styled.div(() =>
  css({
    display: 'grid',
    height: '100vh',
  })
);

export const LyricsPageContainer = styled.div(() => {
  const gradientBg = keyframes`
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

  const scrollUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(50%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

  const nextTextBackgroundEffect = {
    background: 'linear-gradient(90deg, #e1e1e1, #f0f0, #e1e1e1)',
    backgroundSize: '400% 400%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    textFillColor: 'transparent',
    WebkitTextFillColor: 'transparent',
  };

  return css({
    display: 'grid',
    gridTemplateRows: '5fr 1fr',
    position: 'relative',
    margin: '0 16px',
    width: '80vw',
    fontSize: [7, 8],
    fontWeight: 'bold',
    overflow: 'hidden',
    p: {
      margin: '0px',
      padding: '0px',
      position: 'relative',
      display: 'none',
      '&.active': {
        animationName: `${scrollUp}`,
        animationDuration: '200ms',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'forwards',
        display: 'block',
        alignSelf: 'center',
        textShadow: '0px 0px 10px rgba(0, 0, 0, 0.6);',
        padding: 3,
      },
      '&.next': {
        animation: `${gradientBg} 12000ms ease infinite`,
        opacity: 0.9,
        color: 'gray',
        display: 'block',
        height: '120px',
        overflow: 'hidden',
        fontSize: [6, 7],
        alignSelf: 'end',
        ...nextTextBackgroundEffect,
      },
      '&.prev': {
        display: 'none',
      },
    },
  });
});

export const LoadingContainer = styled.div(() =>
  css({
    position: 'absolute',
    display: 'flex',
    height: '100vh',
    width: '100vw',
    justifyContent: 'center',
    alignItems: 'center',
  })
);
