interface RoomDetailPageProps {
  params: {
    roomId: string;
  };
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = params;
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">대기방 #{roomId}</h1>
      <div className="p-8 border rounded-md">
        <p className="text-lg">다른 플레이어를 기다리는 중...</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          게임 시작
        </button>
      </div>
    </div>
  );
}