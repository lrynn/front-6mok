"use client"

import { NextRequest, NextResponse } from 'next/server';
import { useEffect, useState } from "react";

export interface Stone {
  team: number;
  order: number;
}
export type Board = Stone[][];

let roomNumber: number = 0;

const url = `http://localhost:8000/games/${roomNumber}`;

function initBoard() {
  const [board, setBoard] = useState<Board>([]);

  useEffect(() => {
    fetch(`${url}/get/all`)
      .then((r) => r.json())
      .then((data: Board) => setBoard(data));
  }, []);

  return board;
}

async function setStone([x, y]: [number, number]) {
  const params = { x, y };

  try {
    const res = await fetch(`${url}/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json(); // 서버 응답
    console.log(data);
    return data;
  }
  catch (err) {
    console.error('setStone 실패:', err);
    throw err;
  }
}

export default function Game() {
  const board: Board = initBoard();

  const [desiredAxis, setDesiredAxis] = useState<number[]>([]);

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${board[0]?.length ?? 0}, 2rem)` }}>
        {board.flat().map((cell, idx) => (
          <div
            key={idx}
            className="w-8 h-8 border"
            style={{ color: cell.team > 0 ? "black" : "white", textAlign: 'center' }}
          >
            {cell.order!=0 ? '●' : ''}
          </div>
        ))}
      </div>
      <button onClick={() => setStone([1, 1])}>Set Stone</button>
    </>
  );
}