import React from "react";
import { TrophyFilled } from "@ant-design/icons";

const getTrophyColor = (bet) => {
  if (!bet) return "#d9d9d9";
  if (bet.game_bet?.result === "win") return "#52c41a";
  if (bet.game_bet?.result === "loss") return "#ff4d4f";
  if (bet.game_bet?.result === "push") return "#faad14";
  return "#8c8c8c";
};

const NFL_SLOTS = [
  { key: "one_point", pts: 1 },
  { key: "two_point", pts: 2 },
  { key: "three_point", pts: 3 },
];

const MLB_SLOTS = [
  { key: 0, pts: 1 },
  { key: 1, pts: 1 },
  { key: 2, pts: 1 },
  { key: 3, pts: 1 },
  { key: "big_bet", pts: 6 },
];

const TrophyIndicators = ({ sport, bets }) => {
  const slots = sport === "MLB" ? MLB_SLOTS : NFL_SLOTS;

  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
      }}
    >
      {slots.map((slot, index) => {
        let bet;
        if (sport === "MLB") {
          bet =
            slot.key === "big_bet"
              ? bets?.big_bet
              : bets?.regular_bets?.[slot.key];
        } else {
          bet = bets?.[slot.key];
        }
        const color = getTrophyColor(bet);
        return (
          <span
            key={sport === "MLB" ? `mlb-${index}` : slot.key}
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginLeft: 4,
            }}
          >
            <TrophyFilled style={{ color, fontSize: 18, marginRight: 2 }} />
            <span style={{ fontWeight: 600, color }}>{slot.pts}</span>
          </span>
        );
      })}
    </span>
  );
};

export default TrophyIndicators;
