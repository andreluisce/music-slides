import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { BasicCard } from '../components/BasicCard';
import { TitleCard } from '../components/TitleCard';
import { bounce, AnimatedCard } from '../components/AnimatedCard';

function Next() {
  return (
    <React.Fragment>
      <Head>
        <title>Next - Nextron (with-typescript-emotion)</title>
      </Head>
      <div>
        <TitleCard>Nextron with Emotion</TitleCard>
        <BasicCard>
          <Link href="/home">
            <a>Go to home page</a>
          </Link>
        </BasicCard>
        <AnimatedCard animation={bounce}><div className="letras-musica"> 
  <p>Oh baby, baby</p>
  <p>How was I supposed to know</p>
  <p>That something wasn't right here</p>
  <p>Oh baby, baby</p>
  <p>I shouldn't have let you go</p>
</div>
</AnimatedCard>
      </div>
    </React.Fragment>
  );
};

export default Next;
