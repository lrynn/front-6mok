"use client"

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
  initBoard()
  보드를 초기화합니다.
*/

function useInitBoard() {
  const [board, setBoard] = useState<Board>(
    () =>
      Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => ({ team: 0, order: 0 }))
      )
  );

  useEffect(() => {
    fetch(`${url}/get-all`)
      .then((r) => r.json())
      .then((data: Board) => setBoard(data));
  }, []);

  return [board, setBoard] as const;
}

/*
  useSpectate(room_id)
  SSE 연결을 제공합니다.
*/
interface SseData {
  type: string;
  stone: Stone;
  axis: [number, number];
}
function useSpectate(setBoard: React.Dispatch<React.SetStateAction<Board>>, roomId: string) {
  useEffect(() => {
    const es = new EventSource(
      `${url}/sse`
    );

    es.onmessage = (ev) => {
      console.log('Raw SSE data:', ev.data);
      const data = JSON.parse(ev.data) as SseData;
      if (data.type === 'set') {
        setBoard(prevBoard => {
          const newBoard = prevBoard.map(row => row.map(stone => ({ ...stone })));
          newBoard[data.axis[0]][data.axis[1]] = data.stone;
          return newBoard;
        });
      }
    };

    return () => es.close();
  }, [roomId, setBoard]);
}

/*
  setStone([x, y])
  지정된 좌표에 돌을 두겠다는 요청을 서버에 전송합니다.
*/
async function setStone([y, x]: [number, number]) {
  const params = { y, x };

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
  const [board, setBoard] = useInitBoard();
  useSpectate(setBoard, roomId);

  const cellSize: number = 40; // px per cell

  const [hover, setHover] = useState<{ x: number, y: number } | null>(null);
  const handleMouseLeave = () => setHover(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - 20;
    const offsetY = e.clientY - rect.top - 20;
    const x = Math.round(offsetX / cellSize);
    const y = Math.round(offsetY / cellSize);

    // 유효 범위 체크 (보드 밖 클릭 방지)
    if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
      setHover({ x, y });
    } else {
      setHover(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        width: `${cellSize * boardSize}px`,
        height: `${cellSize * boardSize}px`,
        position: "relative",
        margin: "auto",
        border: "1px solid #000",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (hover) setStone([hover.y, hover.x]);
      }}
    >
      {/* Render grid lines */}
      {Array.from({ length: boardSize }).map((_, i) => (
        <div
          key={`hline-${i}`}
          style={{
            position: "absolute",
            left: `${cellSize / 2}px`,
            top: `${i * cellSize + cellSize / 2}px`,
            width: `${cellSize * (boardSize - 1)}px`,
            height: 0,
            borderTop: "1px solid black",
            zIndex: 1,
          }}
        />
      ))}
      {Array.from({ length: boardSize }).map((_, i) => (
        <div
          key={`vline-${i}`}
          style={{
            position: "absolute",
            top: `${cellSize / 2}px`,
            left: `${i * cellSize + cellSize / 2}px`,
            height: `${cellSize * (boardSize - 1)}px`,
            width: 0,
            borderLeft: "1px solid black",
            zIndex: 1,
          }}
        />
      ))}
      {/* Render stones and hover */}
      {board.map((row, x) =>
        row.map((stone, y) => {
          const isHover = hover?.x === x && hover?.y === y;
          if (stone.team === 0 && !isHover) return null;
          return (
            <div
              key={`${y}-${x}`}
              style={{
                position: "absolute",
                left: `${x * cellSize + cellSize / 2}px`,
                top: `${y * cellSize + cellSize / 2}px`,
                transform: "translate(-50%, -50%)",
                width: `${cellSize * 0.8}px`,
                height: `${cellSize * 0.8}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              {stone.team !== 0 && (
                <div style={{
                  backgroundColor: stone.team > 0 ? "black" : "white",
                  borderRadius: "50%",
                  width: "100%",
                  height: "100%",
                  border: "1px solid #333",
                }} />
              )}
              {stone.team === 0 && isHover && (
                <div style={{
                  backgroundColor: "gray",
                  borderRadius: "50%",
                  width: "100%",
                  height: "100%",
                  opacity: 0.4,
                }} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}