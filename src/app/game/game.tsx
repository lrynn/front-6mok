"use client"

import { useEffect, useRef, useState } from "react";

export default function Game(roomNumber: number) {

  const socketRef = useRef<WebSocket | null>(null);

  const [board, setBoard] = useState<number[][]>([]);
  const [placingStone, setPlacingStone] = useState<number[]>();

  useEffect()

}