import React, { useContext } from "react";
import { Button, Layout, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../provider/UserProfileProvider";
const { Content } = Layout;
const { Title, Text } = Typography;

const HomeAuthenticated = () => {
  const navigate = useNavigate();
  const { userProfile, isUserFetching, userRefetch } = useUserProfile();

  console.log("User Profile:", userProfile);
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "50px" }}>
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Title level={2}>Welcome to the Fortunas Bets</Title>
          <Text>{`You have signed in ${userProfile?.name || "User"}`}</Text>
        </div>
      </Content>
    </Layout>
  );
};

export default HomeAuthenticated;
