import React from "react";
import { Table, Avatar, Tag, Space, Button, Card, Typography } from "antd";
import { UserOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";

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
          {userStats.map((userStat) => (
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
                          <Text strong>
                            {userStat.user_id === user?.user_id
                              ? "Your Bets"
                              : `${userStat.user_name}'s Bets`}
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
                          onClick={() => toggleUserExpansion(userStat.user_id)}
                        >
                          Hide
                        </Button>
                      }
                    >
                      {userStat.bets.map((bet, index) =>
                        safeRenderBetCard(
                          bet,
                          userStat.user_id === user?.user_id,
                        ),
                      )}
                    </Card>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomBetsTable;
