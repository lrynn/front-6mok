import GameClient from './GameClient';
import Chat from './Chat';

interface GamePageProps {
  params: {
    roomId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const { roomId } = params;

  return (
    <div className="flex h-screen p-4 space-x-4">
      <div className="w-3/4">
        <GameClient roomId={roomId} />
      </div>
      <div className="w-1/4">
        <Chat roomId={roomId} />
      </div>
    </div>
  );
}