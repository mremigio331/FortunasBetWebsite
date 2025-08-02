import React from "react";
import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;

const PageNavigationBar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect mobile
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  // Determine which menu item is selected
  let selectedKey = "home";
  if (location.pathname.startsWith("/user/profile")) {
    selectedKey = "profile";
  } else {
    selectedKey = "home";
  }

  if (isMobile) {
    // Render as a bottom nav bar on mobile
    return (
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1002,
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          width: "100vw",
        }}
      >
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          style={{
            display: "flex",
            justifyContent: "space-around",
            border: "none",
            background: "#fff",
          }}
          onClick={({ key }) => {
            if (key === "home") navigate("/");
            else if (key === "users") navigate("/users");
            else if (key === "profile") navigate("/user/profile");
          }}
          items={[
            {
              key: "home",
              icon: <HomeOutlined />,
              label: "Home",
            },
            {
              key: "users",
              icon: <TeamOutlined />,
              label: "Users",
            },
            {
              key: "profile",
              icon: <UserOutlined />,
              label: "Profile",
            },
          ]}
        />
      </div>
    );
  }

  // Desktop: keep as Sider
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={180}
      style={{
        background: "#fff",
        position: "fixed",
        top: 64,
        left: 0,
        height: "calc(100vh - 64px)",
        zIndex: 1000,
        borderRight: "1px solid #f0f0f0",
        boxSizing: "border-box",
      }}
      trigger={null}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ height: "100%", borderRight: 0 }}
        onClick={({ key }) => {
          if (key === "home") navigate("/");
          else if (key === "users") navigate("/users");
          else if (key === "profile") navigate("/user/profile");
        }}
        items={[
          {
            key: "home",
            icon: <HomeOutlined />,
            label: "Home",
          },
          {
            key: "users",
            icon: <TeamOutlined />,
            label: "Users",
          },
          {
            key: "profile",
            icon: <UserOutlined />,
            label: "Profile",
          },
        ]}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          padding: 8,
          textAlign: "center",
        }}
      >
        <span
          style={{ cursor: "pointer", fontSize: 18 }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </div>
    </Sider>
  );
};

export default PageNavigationBar;
