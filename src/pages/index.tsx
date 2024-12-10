import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  return (
    <>
      <main className={`${styles.main} ${inter.className}`}>
        <AppWithoutSSR />
      </main>
    </>
  );
}

