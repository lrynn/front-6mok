"use client";

import Chat from "./chat";
import GamePage from "./game";

export default function Home() {
  return (
    Chat()
    GamePage(1)
  );
}