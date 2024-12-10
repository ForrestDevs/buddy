import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>$BUDDY</title>
        <meta name="description" content="Kick the $BUDDY" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="$BUDDY" />
        <meta property="og:description" content="Kick the $BUDDY" />
        <meta property="og:image" content="/og.png" />
       
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

