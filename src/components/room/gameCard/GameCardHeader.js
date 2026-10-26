import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

// ESPN weather comes from AccuWeather, whose icon codes are the conditionId.
// https://developer.accuweather.com/weather-icons
const getWeatherIcon = (conditionId) => {
  const id = Number(conditionId);
  if ([1, 2, 30].includes(id)) return "☀️";
  if ([3, 4, 5].includes(id)) return "🌤️";
  if ([6, 7, 8].includes(id)) return "☁️";
  if (id === 11) return "🌫️";
  if ([12, 13, 14, 18, 26, 39, 40].includes(id)) return "🌧️";
  if ([15, 16, 17, 41, 42].includes(id)) return "⛈️";
  if ([19, 20, 21, 22, 23, 24, 25, 29, 43, 44].includes(id)) return "🌨️";
  if (id === 32) return "💨";
  if ([33, 34].includes(id)) return "🌙";
  if ([35, 36, 37, 38].includes(id)) return "☁️";
  return "🌡️";
};

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

      {/* Forecast only matters for upcoming outdoor games; ESPN still sends
          an outdoor forecast for domes, so hide it there. */}
      {game.weather &&
        game.status?.state === "pre" &&
        !game.venue?.indoor && (
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
            {getWeatherIcon(game.weather.conditionId)}{" "}
            {game.weather.displayValue}
            {game.weather.temperature !== null &&
              game.weather.temperature !== undefined &&
              ` · ${game.weather.temperature}°F`}
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
