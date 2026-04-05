import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

const GameCardHeader = ({ game, roomSport }) => {
  return (
    <div style={{ textAlign: "center", marginBottom: 12 }}>
      <Text strong style={{ fontSize: 14 }}>
        {new Date(game.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>

      {game.venue && (game.venue.name || game.venue.city) && (
        <div
          style={{
            fontSize: 10,
            color: "#666",
            marginTop: 2,
            fontStyle: "italic",
          }}
        >
          {game.venue.name && game.venue.city
            ? `${game.venue.name}, ${game.venue.city}${game.venue.state ? `, ${game.venue.state}` : ""}`
            : game.venue.name ||
              `${game.venue.city}${game.venue.state ? `, ${game.venue.state}` : ""}`}
          {game.venue.indoor && (
            <span
              style={{
                marginLeft: 4,
                fontSize: 9,
                backgroundColor: "#e6f7ff",
                color: "#1890ff",
                padding: "1px 3px",
                borderRadius: 2,
              }}
            >
              INDOOR
            </span>
          )}
        </div>
      )}

      {game.status && (
        <div style={{ marginTop: 4 }}>
          {game.status.state === "in" ? (
            <div
              style={{
                fontSize: 12,
                color: "#ff4d4f",
                fontWeight: 600,
                backgroundColor: "#fff2f0",
                padding: "2px 6px",
                borderRadius: 4,
                display: "inline-block",
              }}
            >
              🔴 LIVE -{" "}
              {roomSport === "MLB"
                ? `${game.status.shortDetail || `Inn ${game.status.period}`}`
                : `Q${game.status.period} ${game.status.displayClock}`}
            </div>
          ) : game.status.state === "post" ? (
            <div
              style={{
                fontSize: 12,
                color: "#52c41a",
                fontWeight: 600,
                backgroundColor: "#f6ffed",
                padding: "2px 6px",
                borderRadius: 4,
                display: "inline-block",
              }}
            >
              ✅ {game.status.shortDetail || "FINAL"}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              {game.status.shortDetail || "Scheduled"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameCardHeader;
