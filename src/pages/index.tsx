import Head from "next/head";
import { Ultra } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";

const ultra = Ultra({ subsets: ["latin"], weight: "400" });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ultra&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className={`${styles.main} ${ultra.className}`}>
        <AppWithoutSSR />
      </main>
    </>
  );
}

