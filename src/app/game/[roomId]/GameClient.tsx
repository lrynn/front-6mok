"use client"

import { useEffect, useState } from "react";

export interface Stone {
  team: number;
  order: number;
}

export type Board = Stone[][];

let boardSize: number = 19;

/*
  initBoard()
  보드를 초기화합니다.
*/

function initBoard(roomId: string | null) {
  const [board, setBoard] = useState<Board>(
    () =>
      Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => ({ team: 0, order: 0 }))
      )
  );

  useEffect(() => {
    if (!roomId) return;
    fetch(`http://localhost:8000/games/${roomId}/status-all`)
      .then((r) => r.json())
      .then((data: Board) => setBoard(data));
  }, [roomId]);

  return [board, setBoard] as const;
}

/*
  useSpectate(room_id)
  WebSocket 연결을 통해 게임 상태 업데이트를 수신합니다.
*/
interface WebSocketMessage {
  type: 'set' | 'chat' | 'user_joined' | 'user_left';
  payload: any;
}

function useSpectate(setBoard: React.Dispatch<React.SetStateAction<Board>>, roomId: string | null) {
  useEffect(() => {
    if (!roomId) return;
    // 실제 accountId는 인증 시스템 등에서 가져와야 합니다.
    const accountId = `user_${Math.random().toString(36).substring(7)}`;
    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${accountId}`);

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'set') {
          const { axis, stone } = message.payload;
          setBoard(prevBoard => {
            // board 불변성 유지를 위해 깊은 복사
            const newBoard = prevBoard.map(row => row.map(s => ({ ...s })));
            newBoard[axis[0]][axis[1]] = stone;
            return newBoard;
          });
        }
      } catch (error) {
        console.error("Failed to parse or process WebSocket message:", error);
      }
    };

    ws.onopen = () => {
      console.log(`WebSocket connection established for room ${roomId}`);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.reason);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // 컴포넌트 언마운트 시 WebSocket 연결을 정리합니다.
    return () => {
      ws.close();
    };
  }, [roomId, setBoard]);
}

/*
  setStone([x, y])
  지정된 좌표에 돌을 두겠다는 요청을 서버에 전송합니다.
*/
async function setStone([y, x]: [number, number], roomId: string | null) {
  if (!roomId) return;
  const params = { y, x };

  try {
    const res = await fetch(`http://localhost:8000/games/${roomId}/set`, {
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

export default function GameClient({ roomId }: { roomId: string }) {
  const [board, setBoard] = initBoard(roomId);
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

  if (!roomId) {
    return <div>Room ID not found.</div>;
  }

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
        if (hover) setStone([hover.y, hover.x], roomId);
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