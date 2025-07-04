"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 'rooms/all' API 응답을 위한 인터페이스
interface RoomBasicInfo {
  id: string;
  is_started: boolean;
}

// 'rooms/{room_id}/info' API 응답을 위한 인터페이스
interface RoomDetailInfo {
  id: string;
  name: string;
  participants: number;
  is_started: boolean;
  game: {
    boardSize: number;
    teamSize: number;
  };
}

export default function RoomsPage() {
  // 전체 방 목록 (정렬됨)
  const [allRooms, setAllRooms] = useState<RoomBasicInfo[]>([]);
  // 현재 페이지에 표시될 방의 상세 정보
  const [displayedRooms, setDisplayedRooms] = useState<RoomDetailInfo[]>([]);
  // 현재 페이지 번호 (1부터 시작)
  const [currentPage, setCurrentPage] = useState(1);
  // 전체 페이지 수
  const [totalPages, setTotalPages] = useState(0);
  // 로딩 상태
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 5;

  // 1. 컴포넌트 마운트 시 모든 방 목록을 가져와 정렬합니다.
  useEffect(() => {
    const host = window.location.hostname;
    const API_BASE_URL = `http://${host}:8000/rooms`;

    const fetchAndSortAllRooms = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/all`);
        if (!response.ok) {
          throw new Error('Failed to fetch all rooms');
        }
        const roomsData: RoomBasicInfo[] = await response.json();

        const sortedRooms = roomsData.sort((a, b) => {
          if (a.is_started !== b.is_started) {
            return a.is_started ? 1 : -1;
          }
          return a.id.localeCompare(b.id);
        });

        setAllRooms(sortedRooms);
        setTotalPages(Math.ceil(sortedRooms.length / ITEMS_PER_PAGE));
      } catch (error) {
        console.error("모든 방 목록을 불러오는 데 실패했습니다:", error);
        setAllRooms([]);
        setTotalPages(0);
      }
      // 로딩 상태는 두 번째 useEffect에서 최종적으로 관리합니다.
    };

    fetchAndSortAllRooms();
  }, []); // 마운트 시 한 번만 실행

  // 2. 페이지가 변경되거나 전체 방 목록이 로드되면 해당 페이지의 방 상세 정보를 가져옵니다.
  useEffect(() => {
    // 아직 전체 방 목록이 로드되지 않았거나, 로드된 방이 없는 경우
    if (allRooms.length === 0) {
      // 초기 로딩 시 totalPages가 0이면 (즉, fetchAndSortAllRooms 후에도 방이 없으면) 로딩 종료
      if (totalPages === 0) setLoading(false);
      return;
    }

    const host = window.location.hostname;
    const API_BASE_URL = `http://${host}:8000/rooms`;

    const fetchRoomDetailsForPage = async () => {
      setLoading(true);
      
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const roomsForPage = allRooms.slice(startIndex, endIndex);

      if (roomsForPage.length === 0) {
        setDisplayedRooms([]);
        setLoading(false);
        return;
      }

      try {
        const roomDetailPromises = roomsForPage.map(room =>
          fetch(`${API_BASE_URL}/${room.id}/info`).then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch info for room ${room.id}`);
            }
            return res.json();
          })
        );
        
        const detailedRoomsData = await Promise.all(roomDetailPromises);
        setDisplayedRooms(detailedRoomsData);

      } catch (error) {
        console.error("방 상세 정보를 불러오는 데 실패했습니다:", error);
        setDisplayedRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetailsForPage();
  }, [currentPage, allRooms, totalPages]); // allRooms가 설정되거나 currentPage가 바뀔 때 실행

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">대기방 목록</h1>
      
      {loading && <p>방 목록을 불러오는 중...</p>}
      
      {!loading && displayedRooms.length === 0 && <p>현재 열린 방이 없습니다.</p>}
      
      {!loading && displayedRooms.length > 0 && (
        <>
          <ul className="space-y-2">
            {displayedRooms.map((room) => (
              <li 
                key={room.id} 
                className="p-4 border rounded-md hover:bg-gray-100 flex justify-between items-center"
              >
                <Link href={`/rooms/${room.id}`} className="w-full">
                  <span className="text-lg font-semibold">{room.name}</span>
                  <span className="text-sm text-gray-600 px-3">{`Room #${room.id}`}</span>
                  <div className="text-sm text-gray-600">
                    <span>참여 인원: {room.participants} / {room.game.teamSize * 2}</span>
                    <span className={`ml-4 font-bold ${room.is_started ? 'text-red-500' : 'text-green-500'}`}>
                      {room.is_started ? '게임 중' : '대기 중'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex justify-center items-center mt-6 space-x-4">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              이전
            </button>
            <span>{currentPage} / {totalPages || 1}</span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}