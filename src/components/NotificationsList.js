import React from "react";
import { Card, Button, Typography, Tag, message } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useNotifications } from "../provider/NotificationsProvider";

const { Title, Paragraph } = Typography;

const formatTimestamp = (ts) => {
  if (!ts) return "";
  const date = new Date(ts * 1000);
  return date.toLocaleString();
};

const NotificationCard = ({ notification, onAcknowledge, loading }) => {
  const isViewed = notification.view;
  return (
    <Card
      style={{
        marginBottom: 16,
        background: isViewed ? "#f5f5f5" : "#fffbe6",
        borderColor: isViewed ? "#d9d9d9" : "#faad14",
        opacity: isViewed ? 0.7 : 1,
        boxShadow: isViewed ? undefined : "0 2px 8px rgba(250,173,20,0.08)",
      }}
      headStyle={{
        background: isViewed ? "#fafafa" : "#fffbe6",
        borderBottom: isViewed ? "1px solid #d9d9d9" : "1px solid #faad14",
      }}
      title={
        <span>
          <Tag
            color={isViewed ? "default" : "gold"}
            style={{ fontWeight: 600 }}
          >
            {notification.notification_type}
          </Tag>
        </span>
      }
      extra={
        !isViewed && (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            loading={loading}
            onClick={() => onAcknowledge(notification)}
          >
            Acknowledge
          </Button>
        )
      }
    >
      <Paragraph style={{ marginBottom: 4 }}>{notification.message}</Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
        {formatTimestamp(notification.timestamp)}
      </Paragraph>
    </Card>
  );
};

const NotificationsList = () => {
  const {
    notifications,
    acknowledgeNotification,
    acknowledgeNotificationLoading: ackLoading,
  } = useNotifications();

  const flatNotifications =
    Array.isArray(notifications) && Array.isArray(notifications[0])
      ? notifications.flat()
      : notifications;

  const handleAcknowledge = (notification) => {
    // Extract user_id and notification_id from PK and SK
    const user_id = notification.PK?.split("USER#")[1] || "";
    const notification_id = notification.SK?.split("NOTIFICATION#")[1] || "";
    if (!user_id || !notification_id) {
      message.error("Invalid notification data.");
      return;
    }
    acknowledgeNotification(
      { user_id, notification_id },
      {
        onSuccess: () => {
          message.success("Notification acknowledged!");
        },
        onError: () => {
          message.error("Failed to acknowledge notification.");
        },
      },
    );
  };

  if (!flatNotifications || flatNotifications.length === 0) {
    return (
      <div style={{ color: "#8c8c8c", textAlign: "center", marginTop: 32 }}>
        No notifications
      </div>
    );
  }
  return (
    <div>
      {flatNotifications.map((n, idx) => (
        <NotificationCard
          key={idx}
          notification={n}
          onAcknowledge={handleAcknowledge}
          loading={ackLoading}
        />
      ))}
    </div>
  );
};

export default NotificationsList;
