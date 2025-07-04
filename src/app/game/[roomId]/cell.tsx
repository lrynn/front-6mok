
interface CellProps {
  x: number;
  y: number;
  team: number;
  hover?: boolean;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onClick: (x: number, y: number) => void;
}

export default function Cell({ x, y, team, hover, onHover, onLeave, onClick }: CellProps) {
  return (
    <div
    onMouseEnter={() => onHover(x, y)}
    onMouseLeave={onLeave}
    onClick={() => onClick(x, y)}
    style={{
      backgroundColor: "brown",
      border: "1px solid #ccc",
      position: "relative",
      aspectRatio: "1 / 1"
    }}
    >
      {team !== 0 && (
        <div style={{
          backgroundColor: team > 0 ? "black" : "white",
          borderRadius: "50%",
          width: "80%",
          height: "80%",
          margin: "10%",
          }} />
      )}
      { team === 0 && hover && (
        <div style={{
          backgroundColor: "gray",
          borderRadius: "50%",
          width: "80%",
          height: "80%",
          margin: "10%",
          opacity: 0.4,
        }} />
      )}
    </div>
  );
}
