import React, { useState } from "react";
import { Table, Avatar, Tag, Space, Button, Card, Typography } from "antd";
import { UserOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import nflWeeks from "../../constants/nflWeek"; // Import the NFL weeks constant

const { Text } = Typography;

const RoomBetsTable = ({
  userStats,
  userStatsColumns,
  expandedUsers,
  toggleUserExpansion,
  getAvatarStyle,
  user,
  renderBetCard,
}) => {
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const getWeekForDate = (date) => {
    const gameDate = new Date(date * 1000);
    const week = nflWeeks.find(
      (w) => new Date(w.start) <= gameDate && gameDate <= new Date(w.end),
    );
    return week ? week.week : "Unknown Week";
  };

  const groupBetsByWeek = (bets) => {
    const weeks = {};
    bets.forEach((bet) => {
      const week = bet.event_datetime
        ? getWeekForDate(bet.event_datetime)
        : "Unknown Week";
      if (!weeks[week]) weeks[week] = [];
      weeks[week].push(bet);
    });
    return weeks;
  };

  const toggleWeekExpansion = (week) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [week]: !prev[week],
    }));
  };

  // fallback: if renderBetCard is not provided, render nothing for bets
  const safeRenderBetCard =
    typeof renderBetCard === "function" ? renderBetCard : () => null;

  return (
    <div className="bet-history-table-wrapper">
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            {userStatsColumns.map((col) => (
              <th
                key={col.key || col.dataIndex}
                style={{ textAlign: col.align || "left" }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {userStats.map((userStat) => {
            const betsByWeek = groupBetsByWeek(userStat.bets);
            return (
              <React.Fragment key={userStat.user_id}>
                <tr>
                  {userStatsColumns.map((col) => (
                    <td
                      key={col.key || col.dataIndex}
                      style={{ textAlign: col.align || "left" }}
                    >
                      {col.render
                        ? col.render(userStat[col.dataIndex], userStat)
                        : userStat[col.dataIndex]}
                    </td>
                  ))}
                </tr>
                {expandedUsers[userStat.user_id] && (
                  <tr>
                    <td
                      colSpan={userStatsColumns.length}
                      style={{ background: "#fafafa", padding: 0 }}
                    >
                      <Card
                        key={`expanded-${userStat.user_id}`}
                        title={
                          <Space>
                            <Avatar
                              icon={<UserOutlined />}
                              size="small"
                              style={getAvatarStyle(userStat.user_color)}
                            />
                            <Text style={{ wordBreak: "break-word" }} strong>
                              {userStat.user_id === user?.user_id
                                ? "Your Bets"
                                : `${userStat.user_name.slice(0, 20)}${
                                    userStat.user_name.length > 20 ? "..." : ""
                                  }'s Bets`}
                            </Text>
                            <Tag color="blue">{userStat.bets.length} bets</Tag>
                          </Space>
                        }
                        size="small"
                        style={{ marginBottom: "0" }}
                        extra={
                          <Button
                            size="small"
                            type="text"
                            icon={<DownOutlined />}
                            onClick={() =>
                              toggleUserExpansion(userStat.user_id)
                            }
                          >
                            Hide
                          </Button>
                        }
                      >
                        {Object.keys(betsByWeek).map((week) => (
                          <div key={week}>
                            <Button
                              type="link"
                              onClick={() => toggleWeekExpansion(week)}
                              style={{ paddingLeft: 0 }}
                            >
                              {expandedWeeks[week] ? (
                                <DownOutlined />
                              ) : (
                                <RightOutlined />
                              )}{" "}
                              {week}
                            </Button>
                            {expandedWeeks[week] && (
                              <div style={{ marginLeft: "16px" }}>
                                {betsByWeek[week].map((bet, index) =>
                                  safeRenderBetCard(
                                    bet,
                                    userStat.user_id === user?.user_id,
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </Card>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoomBetsTable;
