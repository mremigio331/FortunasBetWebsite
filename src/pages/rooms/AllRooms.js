import React, { useMemo, useContext } from "react";
import useIsMobile from "../../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
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
  message,
  Switch,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import useGetAllRooms from "../../hooks/room/useGetAllRooms";
import useCreateMembershipRequest from "../../hooks/membership/useCreateMembershipRequest";
import MembershipStatusTag from "../../components/shared/MembershipStatusTag";
import SportTag from "../../components/shared/SportTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorAlert from "../../components/shared/ErrorAlert";

const { Title } = Typography;
const { Search } = Input;

const AllRooms = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = React.useState("");
  const [hideInactive, setHideInactive] = React.useState(true);
  const { idToken } = useContext(UserAuthenticationContext);

  // Detect mobile
  const isMobile = useIsMobile();

  // Get current user ID from JWT token
  const currentUserId = useMemo(() => {
    if (!idToken) return null;
    try {
      const decoded = jwtDecode(idToken);
      return decoded.sub; // 'sub' is the standard JWT claim for user ID
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, [idToken]);

  const {
    allRooms,
    roomsCount,
    isRoomsFetching,
    isRoomsError,
    roomsError,
    roomsRefetch,
  } = useGetAllRooms(true, hideInactive);

  const { createMembershipRequest, createMembershipRequestLoading } =
    useCreateMembershipRequest();

  // Simple membership status function - uses the membership_status from room data
  const getRoomMembershipStatus = (room) => {
    // If user is not logged in or membership_status is not provided, default to "none"
    return room.membership_status || "none";
  };

  // Handle room access request
  const handleRequestAccess = async (roomId) => {
    try {
      await createMembershipRequest({
        room_id: roomId,
      });
      message.success("Room access requested successfully!");
      // Refetch rooms to get updated membership status
      roomsRefetch();
    } catch (error) {
      message.error("Failed to request room access. Please try again.");
    }
  };

  // Sort rooms: members first, then requested, then others, each group alphabetically
  const sortedAndFilteredRooms = useMemo(() => {
    if (!allRooms || allRooms.length === 0) return [];

    let filtered = allRooms;

    // Filter by search text if provided
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.room_name?.toLowerCase().includes(searchLower) ||
          room.description?.toLowerCase().includes(searchLower) ||
          room.room_id?.toString().includes(searchText),
      );
    }

    // Partition rooms by membership status
    const memberStatuses = ["admin", "approved", "member"];
    const requestedStatuses = ["pending"];

    const memberRooms = filtered.filter((room) =>
      memberStatuses.includes(getRoomMembershipStatus(room)),
    );
    const requestedRooms = filtered.filter((room) =>
      requestedStatuses.includes(getRoomMembershipStatus(room)),
    );
    const otherRooms = filtered.filter(
      (room) =>
        !memberStatuses.includes(getRoomMembershipStatus(room)) &&
        !requestedStatuses.includes(getRoomMembershipStatus(room)),
    );

    // Sort each group alphabetically by room name
    const sortByName = (a, b) => {
      const nameA = a.room_name?.toLowerCase() || "";
      const nameB = b.room_name?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    };

    memberRooms.sort(sortByName);
    requestedRooms.sort(sortByName);
    otherRooms.sort(sortByName);

    return [...memberRooms, ...requestedRooms, ...otherRooms];
  }, [allRooms, searchText]);

  const handleViewRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = () => {
    navigate("/rooms/create");
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Mobile Card Component
  const RoomCard = ({ room }) => {
    const status = getRoomMembershipStatus(room);

    // Tag for public/private
    const publicTag = (
      <Tag color={room.public ? "green" : "red"} style={{ marginRight: 4 }}>
        {room.public ? "Public" : "Private"}
      </Tag>
    );

    // Tag for sport
    const sport = room.sport || "NFL";
    const sportTag = <SportTag sport={sport} size="small" />;

    const renderMembershipStatus = () => {
      return (
        <MembershipStatusTag
          status={status}
          onViewRoom={() => handleViewRoom(room.room_id)}
          onRequestAccess={() => handleRequestAccess(room.room_id)}
          loading={createMembershipRequestLoading}
        />
      );
    };

    return (
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }} hoverable>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "18px",
              color: "#1890ff",
              cursor: "pointer",
              marginBottom: 4,
            }}
            onClick={() => handleViewRoom(room.room_id)}
          >
            {room.room_name || "Unnamed Room"}
          </div>
          <div
            style={{
              color: "#666",
              fontSize: "12px",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {sportTag}
            {publicTag}
            <span>ID: {room.room_id}</span>
          </div>
        </div>

        {room.description && (
          <div style={{ marginBottom: 12, fontSize: "14px", color: "#595959" }}>
            {room.description}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4, fontSize: "12px", color: "#8c8c8c" }}>
            Leagues:
          </div>
          <Space wrap size="small">
            {room.leagues && room.leagues.length > 0 ? (
              room.leagues.map((league, index) => (
                <Tag key={index} color="blue" size="small">
                  {league}
                </Tag>
              ))
            ) : (
              <span style={{ color: "#ccc", fontSize: "12px" }}>
                No leagues
              </span>
            )}
          </Space>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {renderMembershipStatus()}
        </div>
      </Card>
    );
  };

  const columns = [
    {
      title: "Room Name",
      dataIndex: "room_name",
      key: "room_name",
      width: 200,
      sorter: (a, b) => (a.room_name || "").localeCompare(b.room_name || ""),
      render: (text, record) => (
        <div style={{ maxWidth: "200px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "16px",
              color: "#1890ff",
              cursor: "pointer",
              wordBreak: "break-word",
            }}
            onClick={() => handleViewRoom(record.room_id)}
          >
            {text || "Unnamed Room"}
          </div>
          <div
            style={{
              color: "#666",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <SportTag sport={record.sport || "NFL"} size="small" />
            <Tag
              color={record.public ? "green" : "red"}
              style={{ marginRight: 4 }}
            >
              {record.public ? "Public" : "Private"}
            </Tag>
            <span>ID: {record.room_id}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 300,
      render: (text) => (
        <div
          style={{
            maxWidth: "300px",
            wordBreak: "break-word",
            whiteSpace: "normal",
          }}
        >
          {text || <span style={{ color: "#ccc" }}>No description</span>}
        </div>
      ),
    },
    {
      title: "Leagues",
      dataIndex: "leagues",
      key: "leagues",
      width: 120,
      render: (leagues) => (
        <div style={{ maxWidth: "120px" }}>
          <Space wrap size="small">
            {leagues && leagues.length > 0 ? (
              leagues.map((league, index) => (
                <Tag
                  key={index}
                  color="blue"
                  style={{ fontSize: "11px", padding: "2px 6px" }}
                >
                  {league}
                </Tag>
              ))
            ) : (
              <span style={{ color: "#ccc", fontSize: "12px" }}>
                No leagues
              </span>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: "Membership",
      key: "membership",
      width: 150,
      align: "center",
      render: (_, record) => {
        const status = getRoomMembershipStatus(record);

        return (
          <MembershipStatusTag
            status={status}
            onViewRoom={() => handleViewRoom(record.room_id)}
            onRequestAccess={() => handleRequestAccess(record.room_id)}
            loading={createMembershipRequestLoading}
          />
        );
      },
    },
  ];

  if (isRoomsFetching) {
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

  if (isRoomsError) {
    return (
      <div style={{ padding: "24px" }}>
        <ErrorAlert
          title="Error Loading Rooms"
          description={roomsError?.message || "Failed to load rooms"}
          onRetry={roomsRefetch}
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
                All Rooms ({sortedAndFilteredRooms.length})
              </Title>

              {isMobile ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateRoom}
                    block
                  >
                    Create Room
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={roomsRefetch}
                    disabled={isRoomsFetching}
                    block
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateRoom}
                  >
                    Create Room
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={roomsRefetch}
                    disabled={isRoomsFetching}
                  >
                    Refresh
                  </Button>
                </Space>
              )}
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
                  placeholder="Search rooms by name, description, or ID"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onSearch={handleSearch}
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
                  checked={!hideInactive}
                  onChange={(checked) => setHideInactive(!checked)}
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
          // Mobile: Card Layout
          <div>
            {sortedAndFilteredRooms.length > 0 ? (
              sortedAndFilteredRooms.map((room) => (
                <RoomCard key={room.room_id} room={room} />
              ))
            ) : (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#999" }}
              >
                {searchText
                  ? `No rooms found matching "${searchText}"`
                  : "No rooms available"}
              </div>
            )}
          </div>
        ) : (
          // Desktop: Table Layout
          <Table
            columns={columns}
            dataSource={sortedAndFilteredRooms}
            rowKey="room_id"
            pagination={{
              total: sortedAndFilteredRooms.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} rooms`,
            }}
            scroll={{ x: false }}
            size="middle"
            style={{ width: "100%", maxWidth: "100%" }}
            tableLayout="fixed"
            locale={{
              emptyText: searchText
                ? `No rooms found matching "${searchText}"`
                : "No rooms available",
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default AllRooms;
