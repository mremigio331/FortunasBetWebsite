import React, { useMemo } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import { Link } from "react-router-dom";
import {
  Table,
  Card,
  Typography,
  Button,
  Tag,
  Space,
  Input,
  Row,
  Col,
  Switch,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import useGetUserMembershipRequests from "../../hooks/membership/useGetUserMembershipRequests";
import MembershipStatusTag from "../../components/shared/MembershipStatusTag";
import SportTag from "../../components/shared/SportTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorAlert from "../../components/shared/ErrorAlert";

const { Title } = Typography;
const { Search } = Input;

const STATUS_ORDER = { approved: 0, pending: 1, denied: 2 };

const YourRooms = () => {
  const [searchText, setSearchText] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const isMobile = useIsMobile();

  const {
    userMembershipRequests,
    isUserMembershipRequestsFetching,
    isUserMembershipRequestsError,
    userMembershipRequestsError,
    userMembershipRequestsRefetch,
  } = useGetUserMembershipRequests(true);

  const filteredRooms = useMemo(() => {
    if (!userMembershipRequests || userMembershipRequests.length === 0)
      return [];

    let rooms = [...userMembershipRequests];

    // Filter out archived/completed rooms unless toggle is on
    if (!showArchived) {
      rooms = rooms.filter(
        (r) => r.room_status !== "Archived" && r.room_status !== "Completed",
      );
    }

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      rooms = rooms.filter(
        (r) =>
          r.room_name?.toLowerCase().includes(q) ||
          r.room_id?.toString().toLowerCase().includes(q),
      );
    }

    // Sort by membership status order, then alphabetically
    rooms.sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 3;
      const orderB = STATUS_ORDER[b.status] ?? 3;
      if (orderA !== orderB) return orderA - orderB;
      return (a.room_name || "").localeCompare(b.room_name || "");
    });

    return rooms;
  }, [userMembershipRequests, searchText, showArchived]);

  // Room status tag
  const RoomStatusTag = ({ status }) => {
    const colorMap = {
      Active: "green",
      Archived: "default",
      Completed: "blue",
    };
    return (
      <Tag color={colorMap[status] || "default"}>{status || "Unknown"}</Tag>
    );
  };

  // Mobile card component
  const RoomCard = ({ room }) => (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }} hoverable>
      <div style={{ marginBottom: 8 }}>
        <Link
          to={`/room/${room.room_id}`}
          style={{ fontWeight: "bold", fontSize: "18px", color: "#1890ff" }}
        >
          {room.room_name || "Unnamed Room"}
        </Link>
      </div>
      <Space wrap size="small" style={{ marginBottom: 8 }}>
        <SportTag sport={room.room_sport || "NFL"} size="small" />
        <RoomStatusTag status={room.room_status} />
        <MembershipStatusTag status={room.status} />
      </Space>
    </Card>
  );

  const columns = [
    {
      title: "Room Name",
      dataIndex: "room_name",
      key: "room_name",
      sorter: (a, b) => (a.room_name || "").localeCompare(b.room_name || ""),
      render: (text, record) => (
        <Link
          to={`/room/${record.room_id}`}
          style={{ fontWeight: "bold", color: "#1890ff" }}
        >
          {text || "Unnamed Room"}
        </Link>
      ),
    },
    {
      title: "Sport",
      dataIndex: "room_sport",
      key: "room_sport",
      width: 120,
      sorter: (a, b) => (a.room_sport || "").localeCompare(b.room_sport || ""),
      render: (sport) => <SportTag sport={sport || "NFL"} size="small" />,
    },
    {
      title: "Room Status",
      dataIndex: "room_status",
      key: "room_status",
      width: 130,
      sorter: (a, b) =>
        (a.room_status || "").localeCompare(b.room_status || ""),
      render: (status) => <RoomStatusTag status={status} />,
    },
    {
      title: "Membership",
      dataIndex: "status",
      key: "status",
      width: 130,
      sorter: (a, b) =>
        (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3),
      render: (status) => <MembershipStatusTag status={status} />,
    },
  ];

  if (isUserMembershipRequestsFetching) {
    return (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (isUserMembershipRequestsError) {
    return (
      <div style={{ padding: "24px" }}>
        <ErrorAlert
          title="Error Loading Your Rooms"
          description={
            userMembershipRequestsError?.message || "Failed to load your rooms"
          }
          onRetry={userMembershipRequestsRefetch}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col span={24}>
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                marginBottom: "16px",
                gap: isMobile ? "12px" : "0",
              }}
            >
              <Title level={2} style={{ margin: 0 }}>
                Your Rooms ({filteredRooms.length})
              </Title>
              <Button
                icon={<ReloadOutlined />}
                onClick={userMembershipRequestsRefetch}
                disabled={isUserMembershipRequestsFetching}
                block={isMobile}
              >
                Refresh
              </Button>
            </div>
          </Col>

          <Col span={24}>
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <Search
                  placeholder="Search by room name or ID"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onSearch={(v) => setSearchText(v)}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <Switch
                  checked={showArchived}
                  onChange={(checked) => setShowArchived(checked)}
                  size="small"
                />
                <span style={{ fontSize: "13px", color: "#595959" }}>
                  Show archived/completed
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {isMobile ? (
          <div>
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <RoomCard key={room.room_id} room={room} />
              ))
            ) : (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#999" }}
              >
                {searchText
                  ? `No rooms found matching "${searchText}"`
                  : "You are not a member of any rooms yet."}
              </div>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRooms}
            rowKey="room_id"
            pagination={{
              total: filteredRooms.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} rooms`,
            }}
            size="middle"
            tableLayout="fixed"
            locale={{
              emptyText: searchText
                ? `No rooms found matching "${searchText}"`
                : "You are not a member of any rooms yet.",
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default YourRooms;
