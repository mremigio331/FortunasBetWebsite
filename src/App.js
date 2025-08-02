import React from "react";
import { Layout } from "antd";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/home/Home";

const { Content } = Layout;

const App = () => {
  return (
    <Router>
      <Layout style={{ minHeight: "100vh" }}>
        <Navbar />

        {/* Main content area */}
        <Content style={{ padding: "50px", marginTop: "64px" }}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App;
