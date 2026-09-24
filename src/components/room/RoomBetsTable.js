import React from "react";
import { Table, Avatar, Tag, Space, Button, Card, Typography } from "antd";
import { UserOutlined, DownOutlined } from "@ant-design/icons";
import WeekHeader from "./WeekHeader";
import { truncateName } from "../../utils/textUtils";
import { groupBetsByWeek } from "../../utils/betUtils";

const { Text } = Typography;

const RoomBetsTable = ({
  userStats,
  userStatsColumns,
  expansion,
  getAvatarStyle,
  user,
  BetCardComponent,
  onEditBet,
  onRemoveBet,
}) => {
  const { isUserExpanded, toggleUser, isWeekExpanded, toggleWeek } = expansion;

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
                {isUserExpanded(userStat.user_id) && (
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
                                : `${truncateName(userStat.user_name)}'s Bets`}
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
                            onClick={() => toggleUser(userStat.user_id)}
                          >
                            Hide
                          </Button>
                        }
                      >
                        {Object.keys(betsByWeek).map((week) => (
                          <div key={`${userStat.user_id}-week-${week}`}>
                            <WeekHeader
                              week={week}
                              bets={betsByWeek[week]}
                              expanded={isWeekExpanded(userStat.user_id, week)}
                              onToggle={() =>
                                toggleWeek(userStat.user_id, week)
                              }
                            />
                            {isWeekExpanded(userStat.user_id, week) && (
                              <div style={{ marginLeft: "16px" }}>
                                {betsByWeek[week].map((bet) => (
                                  <BetCardComponent
                                    key={`${bet.user_id}-${bet.game_id}-${bet.points_wagered}`}
                                    bet={bet}
                                    isCurrentUser={
                                      userStat.user_id === user?.user_id
                                    }
                                    onEditBet={
                                      userStat.user_id === user?.user_id
                                        ? onEditBet
                                        : undefined
                                    }
                                    onRemoveBet={
                                      userStat.user_id === user?.user_id
                                        ? onRemoveBet
                                        : undefined
                                    }
                                  />
                                ))}
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
