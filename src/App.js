import React, { useState } from "react";
import { Layout, Alert } from "antd";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/home/Home";
import UserProfile from "./pages/user/UserProfile";
import Room from "./pages/rooms/Room";
import AllRooms from "./pages/rooms/AllRooms";
import CreateRoom from "./pages/rooms/CreateRoom";
import { UserAuthenticationContext } from "./provider/UserAuthenticationProvider";
import PageNavigationBar from "./components/PageNavigationBar";

const { Header, Content } = Layout;

const NotificationBar = ({ notifications }) =>
  notifications && notifications.length > 0 ? (
    <div style={{ position: "sticky", top: 0, zIndex: 1002 }}>
      {notifications.map((n, i) => (
        <Alert key={i} message={n.message} type={n.type || "info"} showIcon />
      ))}
    </div>
  ) : null;

const PageRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/user/profile" element={<UserProfile />} />
      <Route path="/room/:roomId" element={<Room />} />
      <Route path="/rooms" element={<AllRooms />} />
      <Route path="/rooms/create" element={<CreateRoom />} />
    </Routes>
  );
};

const App = () => {
  const notifications = [];
  const [sideCollapsed, setSideCollapsed] = useState(true);
  const [sideHidden, setSideHidden] = useState(false);

  // Get authentication status
  const { isAuthenticated } = React.useContext(UserAuthenticationContext);

  const SIDENAV_WIDTH = 180;
  const SIDENAV_COLLAPSED_WIDTH = 80;

  // Detect mobile
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  // Calculate content margin for desktop
  const getContentMarginLeft = () => {
    if (isMobile || !isAuthenticated) return 0;
    return sideCollapsed ? SIDENAV_COLLAPSED_WIDTH : SIDENAV_WIDTH;
  };

  // Calculate bottom padding for mobile navigation
  const getContentPaddingBottom = () => {
    return isMobile && isAuthenticated ? 60 : 0; // Bottom nav height
  };

  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        {isAuthenticated && !sideHidden && !isMobile && (
          <PageNavigationBar
            collapsed={sideCollapsed}
            setCollapsed={setSideCollapsed}
          />
        )}
        <Layout>
          <Header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1001,
              width: "100%",
              height: 64,
              padding: 0,
              margin: 0,
              background: "#001529",
              display: "flex",
              alignItems: "center",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              boxSizing: "border-box",
            }}
          >
            <Navbar />
          </Header>
          <NotificationBar notifications={notifications} />
          <Content
            style={{
              padding: 0,
              paddingBottom: getContentPaddingBottom(),
              margin: 0,
              marginLeft: getContentMarginLeft(),
              boxSizing: "border-box",
              width: `calc(100% - ${getContentMarginLeft()}px)`,
              maxWidth: `calc(100vw - ${getContentMarginLeft()}px)`,
              overflowX: "hidden",
              minHeight: `calc(100vh - 64px - ${getContentPaddingBottom()}px)`,
              transition: "all 0.2s",
            }}
          >
            <PageRoutes />
          </Content>
        </Layout>
        {isAuthenticated && !sideHidden && isMobile && (
          <PageNavigationBar
            collapsed={sideCollapsed}
            setCollapsed={setSideCollapsed}
          />
        )}
      </Layout>
    </Router>
  );
};

export default App;
