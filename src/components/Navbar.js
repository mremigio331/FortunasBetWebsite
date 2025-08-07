import React, { useContext, useState } from "react";
import fortunasLogo from "../assets/fortunasbet.png";
import { Menu, Button, Avatar, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import { UserAuthenticationContext } from "../provider/UserAuthenticationProvider";
import { useUserProfile } from "../provider/UserProfileProvider";

// UserDropdown component for avatar dropdown menu
const UserDropdown = ({ avatarStyle, avatarText, onProfile, onLogout }) => {
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item key="profile" onClick={onProfile}>
            Profile
          </Menu.Item>
          <Menu.Item key="logout" onClick={onLogout}>
            Log Out
          </Menu.Item>
        </Menu>
      }
      placement="bottomRight"
      trigger={["click"]}
    >
      <span>
        <Avatar style={{ ...avatarStyle, cursor: "pointer" }} size="default">
          {avatarText}
        </Avatar>
      </span>
    </Dropdown>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const {
    user,
    nickname,
    isAuthenticated,
    initiateSignIn,
    initiateSignUp,
    logoutUser,
  } = useContext(UserAuthenticationContext);
  const { userProfile } = useUserProfile();
  const [current, setCurrent] = useState("home");

  // Get color style for avatar
  const getAvatarStyle = (color = "blue") => {
    const colorMap = {
      black: { backgroundColor: "#262626", color: "#ffffff" },
      white: {
        backgroundColor: "#ffffff",
        color: "#262626",
        border: "1px solid #d9d9d9",
      },
      red: { backgroundColor: "#ff4d4f", color: "#ffffff" },
      blue: { backgroundColor: "#1890ff", color: "#ffffff" },
      green: { backgroundColor: "#52c41a", color: "#ffffff" },
      yellow: { backgroundColor: "#faad14", color: "#262626" },
      orange: { backgroundColor: "#fa8c16", color: "#ffffff" },
      purple: { backgroundColor: "#722ed1", color: "#ffffff" },
      pink: { backgroundColor: "#eb2f96", color: "#ffffff" },
      brown: { backgroundColor: "#8b4513", color: "#ffffff" },
      gray: { backgroundColor: "#8c8c8c", color: "#ffffff" },
      cyan: { backgroundColor: "#13c2c2", color: "#ffffff" },
    };
    return colorMap[color.toLowerCase()] || colorMap.blue;
  };

  const onClick = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  const items = [
    {
      label: (
        <span
          style={{ color: "white", textDecoration: "none", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          Fortunas Bet
        </span>
      ),
      key: "home",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#234537", // Deep modern green
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: "100%",
        borderBottom: "2px solid #C4A651", // Gold accent underline
        boxShadow: "0 2px 8px rgba(31,60,45,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          color: "#C4A651",
          fontSize: "24px",
          fontWeight: "bold",
          fontFamily: "'Playfair Display', serif",
          backgroundColor: "transparent",
          letterSpacing: "0.02em",
          gap: "12px",
        }}
      >
        <img
          src={fortunasLogo}
          alt="Fortunas Bet Logo"
          style={{ height: 36, width: 36, objectFit: "contain" }}
        />
        <span
          style={{
            color: "#C4A651",
            textDecoration: "none",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          Fortunas Bets
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Menu items (if any) */}
        <Menu
          onClick={onClick}
          selectedKeys={[current]}
          mode="horizontal"
          items={items.slice(1)}
          theme="dark"
          style={{ backgroundColor: "transparent", border: "none" }}
        />

        {/* User section */}
        {isAuthenticated ? (
          <UserDropdown
            avatarStyle={getAvatarStyle(userProfile?.color)}
            avatarText={
              userProfile?.name
                ? userProfile.name.charAt(0).toUpperCase()
                : nickname?.charAt(0)?.toUpperCase() || "U"
            }
            onProfile={() => navigate("/user/profile")}
            onLogout={logoutUser}
          />
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="primary" onClick={initiateSignIn} size="small">
              Sign In
            </Button>
            <Button onClick={initiateSignUp} size="small">
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
