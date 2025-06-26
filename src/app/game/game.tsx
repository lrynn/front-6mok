"use client"

import { NextRequest, NextResponse } from 'next/server';
import { useEffect, useState } from "react";

export interface Stone {
  team: number;
  order: number;
}

export type Board = Stone[][];

let roomId: string = '0';
let boardSize: number = 19;

const url = `http://localhost:8000/games/${roomId}`;

/*
  useSpectate(room_id)
  SSE 연결을 제공합니다.
*/
interface SseData {
  type: string;
  stone: Stone;
  axis: [number, number];
}

function useSpectate(roomId: string) {
  const [board, setBoard] = useState<Stone[][]>(() =>
    Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => ({ team: 0, order: 0 }))
    )
  );

  useEffect(() => {
    const es = new EventSource(
      `${url}/sse`
    );

    es.onmessage = (ev) => {
      console.log('Raw SSE data:', ev.data); // 여기에 주목!
      const data = JSON.parse(ev.data) as SseData;
      if (data.type === 'set') {
        setBoard((prev) => {
          const newBoard = prev.map((row) => row.slice()); // 깊은 복사
          newBoard[data.axis[1]][data.axis[0]] = {
            team: data.stone.team,
            order: data.stone.order
          };
          return newBoard;
        });
      }
    };

    return () => es.close();
  }, [roomId]);

  return board;
}

/*
  initBoard()
  보드를 초기화합니다.
*/

function initBoard() {
  const [board, setBoard] = useState<Board>([]);

  useEffect(() => {
    fetch(`${url}/get-all`)
      .then((r) => r.json())
      .then((data: Board) => setBoard(data));
  }, []);

  return board;
}

/*
  setBoard(board, data)
  SSE 전송 데이터에 따라 보드 내용을 업데이트합니다.
*/
function setBoard(board: Board, data: SseData) {
  let x: number = data.axis[0];
  let y: number = data.axis[1];
  board[y][x] = data.stone;
}

/*
  setStone([x, y])
  지정된 좌표에 돌을 두겠다는 요청을 서버에 전송합니다.
*/
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
  const board = useSpectate(roomId);
  const [desiredAxis, setDesiredAxis] = useState<[number, number]>([0, 0]);

  interface SetXEvent extends React.ChangeEvent<HTMLInputElement> {}

  const setX = (e: SetXEvent) => {
    setDesiredAxis([desiredAxis[0], Number(e.target.value)]);
  };
  const setY = (e: SetXEvent) => {
    setDesiredAxis([Number(e.target.value), desiredAxis[0]]);
  };

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
      <input type='number' onChange={setX}/>
      <input type='number' onChange={setY}/>
      <button onClick={() => setStone(desiredAxis)}>Set Stone</button>
    </>
  );
}