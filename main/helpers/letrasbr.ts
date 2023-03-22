import puppeteer from 'puppeteer';

export default async function lyricFinder(title) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = `https://www.letras.mus.br/?q=${encodeURIComponent(title)}`;

    await page.goto(url, { waitUntil: 'networkidle2' });
    const responses = await page.$$('div.gs-webResult.gs-result');
    const foundSongs = (
      await Promise.all(
        responses.map(resp =>
          resp.evaluate(el => {
            return {
              url: el.querySelector('a.gs-title').getAttribute('href'),
              linkText: el.querySelector('a.gs-title')?.textContent,
              result: el.querySelector('.gs-bidi-start-align.gs-snippet')?.textContent,
            };
          })
        )
      )
    )
      .map(song => {
        if (
          song.url &&
          (song.linkText.includes('LETRAS.MUS.BR') ||
            song.result.includes('(Letra e música para ouvir)'))
        ) {
          const result = song.result.replace('(Letra e música para ouvir) ', '').split(' - ');

          return {
            url: song.url,
            title: song.linkText.split(' - ')[0],
            artist: song.linkText.split(' - ')[1],
            partialLyrics: result?.[2],
          };
        }
      })
      .filter(Boolean);
    await browser?.close();

    return foundSongs;
  } catch (error) {
    console.error(error);
  }
}

export async function getLyricByUrl(url) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });
    const artist = await (await page.$('.cnt-head_title h1')).evaluate(el => el.textContent);
    const musicTitle = await (
      await page.$('.cnt-head_title h2 a span')
    ).evaluate(el => el.textContent);
    const responses = await page.$$('div.cnt-letra p');
    const lyric = await Promise.all(
      responses.map(resp => resp.evaluate(el => el.innerHTML.split('<br>')))
    );

    return { lyric: lyric.flat(3), artist, musicTitle };
  } catch (error) {
    console.error(error);
  }
}
