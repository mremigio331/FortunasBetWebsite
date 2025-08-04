import React, { useEffect, useContext, useState } from "react";
import { useUserProfile } from "../../provider/UserProfileProvider";
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Spin,
  Alert,
  Button,
  message,
  Select,
  Space,
} from "antd";
import usePutProfile from "../../hooks/user/usePutProfile";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";

const { Title, Text } = Typography;
const { Option } = Select;

// Available color options for user avatars
const COLOR_OPTIONS = [
  { value: "black", label: "Black", color: "#262626" },
  { value: "white", label: "White", color: "#ffffff" },
  { value: "red", label: "Red", color: "#ff4d4f" },
  { value: "blue", label: "Blue", color: "#1890ff" },
  { value: "green", label: "Green", color: "#52c41a" },
  { value: "yellow", label: "Yellow", color: "#faad14" },
  { value: "orange", label: "Orange", color: "#fa8c16" },
  { value: "purple", label: "Purple", color: "#722ed1" },
  { value: "pink", label: "Pink", color: "#eb2f96" },
  { value: "brown", label: "Brown", color: "#8b4513" },
  { value: "gray", label: "Gray", color: "#8c8c8c" },
  { value: "cyan", label: "Cyan", color: "#13c2c2" },
];

const UserProfileCard = ({
  userProfile,
  isUserFetching,
  onNameSave,
  nameEditLoading,
  onColorSave,
  colorEditLoading,
}) => {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(userProfile?.name || "");
  const [editingColor, setEditingColor] = useState(false);
  const [colorValue, setColorValue] = useState(userProfile?.color || "blue");

  useEffect(() => {
    setNameValue(userProfile?.name || "");
  }, [userProfile?.name]);

  useEffect(() => {
    setColorValue(userProfile?.color || "blue");
  }, [userProfile?.color]);

  // Get color style for avatar
  const getColorStyle = (color) => {
    const colorOption = COLOR_OPTIONS.find((opt) => opt.value === color);
    if (!colorOption) return { backgroundColor: "#1890ff", color: "#ffffff" };

    return {
      backgroundColor: colorOption.color,
      color: colorOption.value === "white" ? "#262626" : "#ffffff",
      border: colorOption.value === "white" ? "1px solid #d9d9d9" : "none",
    };
  };

  return (
    <Card
      title="User Profile"
      extra={
        <Avatar size={64} style={getColorStyle(userProfile?.color || "blue")}>
          {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
        </Avatar>
      }
    >
      {isUserFetching ? (
        <Spin />
      ) : userProfile ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Name Section */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Display Name
            </Text>
            {editing ? (
              <Space>
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  style={{
                    fontSize: 16,
                    padding: 8,
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                  disabled={nameEditLoading}
                  placeholder="Enter your display name"
                />
                <Button
                  size="small"
                  type="primary"
                  loading={nameEditLoading}
                  onClick={async () => {
                    if (nameValue && nameValue !== userProfile.name) {
                      await onNameSave(nameValue);
                    }
                    setEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(false);
                    setNameValue(userProfile.name || "");
                  }}
                  disabled={nameEditLoading}
                >
                  Cancel
                </Button>
              </Space>
            ) : (
              <Space>
                <Text style={{ fontSize: 16 }}>
                  {userProfile.name || "Not set"}
                </Text>
                <Button size="small" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              </Space>
            )}
          </div>

          {/* Email Section */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Email
            </Text>
            <Text type="secondary">{userProfile.email || "N/A"}</Text>
          </div>

          {/* Avatar Color Section */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Avatar Color
            </Text>
            {editingColor ? (
              <Space>
                <Select
                  value={colorValue}
                  onChange={setColorValue}
                  style={{ width: 150 }}
                  disabled={colorEditLoading}
                >
                  {COLOR_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: option.color,
                            border:
                              option.value === "white"
                                ? "1px solid #d9d9d9"
                                : "none",
                            borderRadius: "50%",
                          }}
                        />
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
                <Button
                  size="small"
                  type="primary"
                  loading={colorEditLoading}
                  onClick={async () => {
                    if (colorValue !== userProfile.color) {
                      await onColorSave(colorValue);
                    }
                    setEditingColor(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setEditingColor(false);
                    setColorValue(userProfile.color || "blue");
                  }}
                  disabled={colorEditLoading}
                >
                  Cancel
                </Button>
              </Space>
            ) : (
              <Space>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar
                    size="small"
                    style={getColorStyle(userProfile.color || "blue")}
                  >
                    {userProfile?.name
                      ? userProfile.name.charAt(0).toUpperCase()
                      : "U"}
                  </Avatar>
                  <Text>
                    {COLOR_OPTIONS.find(
                      (opt) => opt.value === (userProfile.color || "blue"),
                    )?.label || "Blue"}
                  </Text>
                </div>
                <Button size="small" onClick={() => setEditingColor(true)}>
                  Change
                </Button>
              </Space>
            )}
          </div>
        </Space>
      ) : (
        <Alert message="No user profile data." type="info" />
      )}
    </Card>
  );
};

const UserProfile = () => {
  const { userProfile, isUserFetching, userRefetch } = useUserProfile();
  const {
    updateUserProfileAsync,
    updateUserProfileLoading,
    updateUserProfileError,
  } = usePutProfile();
  const { idToken } = useContext(UserAuthenticationContext);

  const [nameEditLoading, setNameEditLoading] = useState(false);
  const [colorEditLoading, setColorEditLoading] = useState(false);

  // Handle name save
  const handleNameSave = async (newName) => {
    setNameEditLoading(true);
    try {
      await updateUserProfileAsync({ name: newName });
      message.success("Name updated!");
      if (typeof userRefetch === "function") {
        userRefetch();
      }
    } catch (err) {
      message.error("Failed to update name.");
    } finally {
      setNameEditLoading(false);
    }
  };

  // Handle color save
  const handleColorSave = async (newColor) => {
    setColorEditLoading(true);
    try {
      await updateUserProfileAsync({ color: newColor });
      message.success("Avatar color updated!");
      if (typeof userRefetch === "function") {
        userRefetch();
      }
    } catch (err) {
      message.error("Failed to update avatar color.");
    } finally {
      setColorEditLoading(false);
    }
  };

  return (
    <Row gutter={32} justify="center" style={{ marginTop: 40 }}>
      <Col xs={24} md={12}>
        <UserProfileCard
          userProfile={userProfile}
          isUserFetching={isUserFetching}
          onNameSave={handleNameSave}
          nameEditLoading={nameEditLoading}
          onColorSave={handleColorSave}
          colorEditLoading={colorEditLoading}
        />
        {updateUserProfileError && (
          <Alert
            message="Failed to update profile."
            description={updateUserProfileError.message}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Col>
    </Row>
  );
};

export default UserProfile;
