import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <meta name="title" content="$BUDDY" />
        <meta name="description" content="Kick the $BUDDY" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="$BUDDY" />
        <meta property="og:description" content="Kick the $BUDDY" />
        <meta property="og:image" content="/og.png" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <AppWithoutSSR />
      </main>
    </>
  );
}

