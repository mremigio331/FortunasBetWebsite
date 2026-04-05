import React from "react";
import { Tag, Image } from "antd";

const getOverallRecord = (records) => {
  const overallRecord = records?.find(
    (r) => r.name === "overall" || r.type === "total",
  );
  return overallRecord?.summary || "";
};

const TeamRow = ({
  team,
  homeAway,
  gameStatus,
  favoredTeam,
  backgroundColor,
}) => {
  if (!team) return null;

  const isPost = gameStatus?.state === "post";
  const isLiveOrPost = gameStatus?.state === "in" || isPost;
  const isPre = gameStatus?.state === "pre";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: homeAway === "away" ? 8 : 0,
        padding: 8,
        backgroundColor,
        borderRadius: 4,
        position: "relative",
      }}
    >
      {isPost && team.winner && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(82, 196, 26, 0.1)",
            border: "2px solid #52c41a",
            borderRadius: 4,
            zIndex: 0,
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}>
        {team.logo && (
          <Image
            src={team.logo}
            alt={team.name}
            width={24}
            height={24}
            preview={false}
          />
        )}
        <div>
          <div
            style={{ fontWeight: 600, fontSize: 12, display: "flex", gap: 6 }}
          >
            <span>
              {team.abbreviation || (homeAway === "home" ? "Home" : "Away")}
            </span>
            {getOverallRecord(team.records) && (
              <span
                style={{
                  fontSize: 10,
                  color: "#666",
                  backgroundColor: "#f5f5f5",
                  padding: "1px 4px",
                  borderRadius: 3,
                  fontWeight: 500,
                }}
              >
                {getOverallRecord(team.records)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#666" }}>
            {team.name || (homeAway === "home" ? "Home Team" : "Away Team")}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}>
        {isLiveOrPost && team.score != null && (
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: isPost && team.winner ? "#52c41a" : "#262626",
              minWidth: 30,
              textAlign: "center",
              backgroundColor: "white",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #d9d9d9",
            }}
          >
            {team.score}
          </div>
        )}
        {favoredTeam === homeAway && isPre && (
          <Tag color="green" size="small">
            FAV
          </Tag>
        )}
        {isPost && team.winner && (
          <Tag color="green" size="small" style={{ fontWeight: 600 }}>
            WINNER
          </Tag>
        )}
      </div>
    </div>
  );
};

export default TeamRow;
