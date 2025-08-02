import React, { useContext } from "react";
import { Button, Layout, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
const { Content } = Layout;
const { Title, Text } = Typography;

const HomeUnauthenticated = () => {
  const { initiateSignIn, initiateSignUp } = useContext(
    UserAuthenticationContext,
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "50px" }}>
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Title level={2}>Welcome to the Fortunas Bets</Title>
          <Text>Let's get you signed in</Text>
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              maxWidth: "300px",
              margin: "20px auto",
            }}
          >
            <Button type="primary" onClick={initiateSignIn}>
              Sign In
            </Button>
            <Button type="primary" onClick={initiateSignUp}>
              Sign Up
            </Button>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default HomeUnauthenticated;
