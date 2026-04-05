import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  DatePicker,
  Radio,
  Row,
  Col,
  Typography,
  Space,
  message,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import useCreateRoom from "../../hooks/room/useCreateRoom";
import useGetValidLeagues from "../../hooks/room/useGetValidLeagues";
import ErrorAlert from "../../components/shared/ErrorAlert";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateRoom = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { createRoom, createRoomLoading, createRoomError, createRoomData } =
    useCreateRoom();

  const {
    validLeagues,
    isValidLeaguesFetching,
    isValidLeaguesError,
    validLeaguesError,
  } = useGetValidLeagues();

  const handleGoBack = () => {
    navigate(-1);
  };

  const SPORT_LEAGUES = {
    NFL: ["NFL"],
    MLB: ["MLB"],
  };

  const handleSportChange = (e) => {
    const sport = e.target.value;
    const leagues = SPORT_LEAGUES[sport] || [];
    form.setFieldsValue({ leagues });
  };

  const handleSubmit = async (values) => {
    try {
      // Convert dates to epoch timestamps
      const roomData = {
        room_name: values.room_name,
        sport: values.sport,
        description: values.description || null,
        leagues: values.leagues,
        public: !values.public,
        start_date: values.start_date ? dayjs(values.start_date).unix() : null,
        end_date: values.end_date ? dayjs(values.end_date).unix() : null,
      };

      await createRoom(roomData);
      message.success("Room created successfully!");

      // Navigate to the new room or rooms list
      if (createRoomData?.room?.room_id) {
        navigate(`/room/${createRoomData.room.room_id}`);
      } else {
        navigate("/rooms");
      }
    } catch (error) {
      message.error("Failed to create room. Please try again.");
    }
  };

  const validateDateRange = (_, value) => {
    const startDate = form.getFieldValue("start_date");
    const endDate = form.getFieldValue("end_date");

    if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
      return Promise.reject(new Error("Start date must be before end date"));
    }
    return Promise.resolve();
  };

  if (isValidLeaguesError) {
    return (
      <div style={{ padding: "24px" }}>
        <ErrorAlert
          title="Error Loading Leagues"
          description={
            validLeaguesError?.message || "Failed to load valid leagues"
          }
        />
        <Button
          size="small"
          onClick={handleGoBack}
          style={{ marginTop: "8px" }}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ marginBottom: "16px" }}
          >
            Back to Rooms
          </Button>
        </Col>

        <Col span={24}>
          <Card>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <Title level={2}>
                <TeamOutlined style={{ marginRight: "8px" }} />
                Create New Room
              </Title>
              <Text type="secondary">
                Set up a new room for your sports betting league
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                public: false,
                leagues: [],
              }}
            >
              <Form.Item
                name="sport"
                label="Sport"
                rules={[{ required: true, message: "Please select a sport" }]}
              >
                <Radio.Group
                  size="large"
                  optionType="button"
                  buttonStyle="solid"
                  onChange={handleSportChange}
                >
                  <Radio.Button value="NFL">NFL</Radio.Button>
                  <Radio.Button value="MLB">MLB</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="room_name"
                    label="Room Name"
                    rules={[
                      { required: true, message: "Please enter a room name" },
                      {
                        min: 3,
                        message: "Room name must be at least 3 characters",
                      },
                      {
                        max: 50,
                        message: "Room name cannot exceed 50 characters",
                      },
                    ]}
                  >
                    <Input placeholder="Enter room name" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="leagues"
                    label="League"
                    rules={[
                      {
                        required: true,
                        message: "Please select a sport first",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Auto-selected based on sport"
                      size="large"
                      disabled
                    >
                      {validLeagues.map((league) => (
                        <Option key={league} value={league}>
                          {league}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="Description (Optional)">
                <TextArea
                  placeholder="Describe your room, rules, or any additional information"
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="start_date"
                    label="Season Start Date"
                    rules={[
                      { required: true, message: "Please select a start date" },
                      { validator: validateDateRange },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select start date"
                      suffixIcon={<CalendarOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="end_date"
                    label="Season End Date"
                    rules={[
                      { required: true, message: "Please select an end date" },
                      { validator: validateDateRange },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select end date"
                      suffixIcon={<CalendarOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="public"
                label="Room Visibility"
                valuePropName="checked"
              >
                <div>
                  <Switch />
                  <span style={{ marginLeft: "8px" }}>
                    Make this room public (anyone can request to join)
                  </span>
                </div>
              </Form.Item>

              {createRoomError && (
                <div style={{ marginBottom: "16px" }}>
                  <ErrorAlert
                    title="Error Creating Room"
                    description={
                      createRoomError.message ||
                      "An error occurred while creating the room"
                    }
                  />
                </div>
              )}

              <Form.Item>
                <Space
                  size="middle"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Button size="large" onClick={handleGoBack}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={createRoomLoading}
                    icon={<PlusOutlined />}
                  >
                    Create Room
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateRoom;
