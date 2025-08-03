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
  Switch,
  message,
} from "antd";
import usePutProfile from "../../hooks/user/usePutProfile";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";

const { Title, Text } = Typography;

const UserProfileCard = ({
  userProfile,
  isUserFetching,
  onTogglePublic,
  updatingPublic,
  onNameSave,
  nameEditLoading,
  onDistanceUnitSave,
  distanceUnitEditLoading,
}) => {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(userProfile?.name || "");
  const [distanceUnit, setDistanceUnit] = useState(
    userProfile?.distance_unit || "Imperial",
  );
  const [editingDistanceUnit, setEditingDistanceUnit] = useState(false);

  useEffect(() => {
    setNameValue(userProfile?.name || "");
  }, [userProfile?.name]);

  useEffect(() => {
    setDistanceUnit(userProfile?.distance_unit || "Imperial");
  }, [userProfile?.distance_unit]);

  return (
    <Card
      title="User Profile"
      extra={
        <Avatar
          size={64}
          src={
            userProfile?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || "User")}`
          }
        />
      }
    >
      {isUserFetching ? (
        <Spin />
      ) : userProfile ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {editing ? (
              <>
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  style={{ fontSize: 18, padding: 4, marginRight: 8 }}
                  disabled={nameEditLoading}
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
                  style={{ marginRight: 4 }}
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
              </>
            ) : (
              <>
                <Title level={4} style={{ margin: 0 }}>
                  {userProfile.name || "N/A"}
                </Title>
                <Button
                  size="small"
                  onClick={() => setEditing(true)}
                  style={{ marginLeft: 8 }}
                >
                  Edit
                </Button>
              </>
            )}
          </div>
          <Text type="secondary">{userProfile.email || "N/A"}</Text>
          <br />

          {userProfile.public_profile !== undefined ? (
            <>
              <Switch
                checked={userProfile.public_profile}
                loading={updatingPublic}
                onChange={onTogglePublic}
                checkedChildren="Public"
                unCheckedChildren="Private"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: userProfile.public_profile ? "green" : "red" }}
              >
                <b>
                  {userProfile.public_profile
                    ? "Public Profile"
                    : "Private Profile"}
                </b>
              </Text>
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="If you want others to see your profile, make sure your profile is set to public."
                  type="info"
                  showIcon
                />
              </div>
            </>
          ) : (
            <Text>N/A</Text>
          )}
        </>
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
  const [distanceUnitEditLoading, setDistanceUnitEditLoading] = useState(false);

  // Handle toggle public/private
  const handleTogglePublic = async (checked) => {
    try {
      await updateUserProfileAsync({ public_profile: checked });
      message.success(`Profile is now ${checked ? "public" : "private"}.`);
      // Force a repull of the user profile
      if (typeof userRefetch === "function") {
        userRefetch();
      }
    } catch (err) {
      message.error("Failed to update profile privacy.");
    }
  };

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

  // Handle distance unit save
  const handleDistanceUnitSave = async (newUnit) => {
    setDistanceUnitEditLoading(true);
    try {
      await updateUserProfileAsync({ distance_unit: newUnit });
      message.success("Distance unit updated!");
      if (typeof userRefetch === "function") {
        userRefetch();
      }
    } catch (err) {
      message.error("Failed to update distance unit.");
    } finally {
      setDistanceUnitEditLoading(false);
    }
  };

  return (
    <Row gutter={32} justify="center" style={{ marginTop: 40 }}>
      <Col xs={24} md={12}>
        <UserProfileCard
          userProfile={userProfile}
          isUserFetching={isUserFetching}
          onTogglePublic={handleTogglePublic}
          updatingPublic={updateUserProfileLoading}
          onNameSave={handleNameSave}
          nameEditLoading={nameEditLoading}
          onDistanceUnitSave={handleDistanceUnitSave}
          distanceUnitEditLoading={distanceUnitEditLoading}
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
