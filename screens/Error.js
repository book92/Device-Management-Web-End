import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Dropdown, Tag, DatePicker
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, StopOutlined } from '@ant-design/icons';
import { FaChartBar, FaUserFriends, FaLaptop, FaExclamationTriangle, FaCog, FaEdit, FaBan, FaUnlock } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../screens/firebaseconfig';
import './Error.css';

const { Option } = Select;

const Error = () => {
  const [errors, setErrors] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingError, setEditingError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchErrors();
  }, []);

  const sortErrors = (errorsData) => {
    return errorsData.sort((a, b) => {
      if (a.state !== b.state) {
        return a.state === 'Chưa sửa' ? -1 : 1;
      }
      return new Date(b.reportday) - new Date(a.reportday);
    });
  };

  const fetchErrors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'ERROR'));
      const errorsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setErrors(sortErrors(errorsData));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching errors: ", error);
      message.error('Không thể tải dữ liệu lỗi thiết bị');
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: '5%',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Tên thiết bị',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: '15%',
    },
    {
      title: 'Phòng',
      dataIndex: 'deviceRoom',
      key: 'deviceRoom',
      width: '10%',
    },
    {
      title: 'Loại thiết bị',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: '10%',
    },
    {
      title: 'Mô tả lỗi',
      dataIndex: 'description',
      key: 'description',
      width: '20%',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: '15%',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'state',
      key: 'state',
      width: '10%',
      render: (state) => (
        <Tag color={state === 'Chưa sửa' ? 'red' : 'green'}>
          {state}
        </Tag>
      )
    },
    {
      title: 'Người báo cáo',
      dataIndex: 'userreport',
      key: 'userreport',
      width: '15%',
    },
    {
      title: 'Ngày báo cáo',
      dataIndex: 'reportday',
      key: 'reportday',
      width: '12%',
    },
    {
      title: 'Ngày sửa',
      dataIndex: 'fixday',
      key: 'fixday',
      width: '12%',
      render: (fixday) => fixday || 'Chưa sửa'
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingError(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'ERROR', id));
      message.success('Xóa thành công');
      fetchErrors();
    } catch (error) {
      console.error("Error deleting error: ", error);
      message.error('Không thể xóa báo cáo lỗi');
    }
  };

  // Thêm hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-info')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">
          <h2>Device Manager</h2>
        </div>
        <nav>
          <Link to="/dashboard">
            <FaChartBar /> Thống kê
          </Link>
          <Link to="/customer" >
            <FaUserFriends /> Quản lý người dùng
          </Link>
          <Link to="/device">
            <FaLaptop /> Quản lý thiết bị
          </Link>
          <Link to="/error"className="active">
            <FaExclamationTriangle /> Quản lý thiết bị lỗi
          </Link>
          <Link to="/settings">
            <FaCog /> Cài đặt
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <div className="header">
          <h2>Quản lý thiết bị lỗi</h2>
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
            <UserOutlined className="user-icon" />
            {showUserMenu && (
              <div className="user-menu">
                <button onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>
        </div>

        <div className="action-bar">
          <Input.Search
            placeholder="Tìm kiếm theo tên thiết bị hoặc mô tả"
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={sortErrors(errors.filter(error => 
            error.deviceName?.toLowerCase().includes(searchText.toLowerCase()) ||
            error.description?.toLowerCase().includes(searchText.toLowerCase())
          ))}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} báo cáo lỗi`
          }}
        />

        <Modal
          title="Chỉnh sửa báo cáo lỗi"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingError(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              try {
                const updateData = {
                  state: values.state,
                };

                // Tự động cập nhật fixday khi trạng thái là "Đã sửa"
                if (values.state === 'Đã sửa') {
                  updateData.fixday = new Date().toString();
                } else {
                  updateData.fixday = null;  // Reset fixday khi trạng thái là "Chưa sửa"
                }
                
                await updateDoc(doc(db, 'ERROR', editingError.id), updateData);
                message.success('Cập nhật thành công');
                setIsModalVisible(false);
                fetchErrors();
              } catch (error) {
                console.error("Error updating error: ", error);
                message.error('Không thể cập nhật báo cáo lỗi');
              }
            }}
          >
            <Form.Item
              name="state"
              label="Trạng thái"
            >
              <Select>
                <Option value="Chưa sửa">Chưa sửa</Option>
                <Option value="Đã sửa">Đã sửa</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Cập nhật
                </Button>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  setEditingError(null);
                  form.resetFields();
                }}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Error;
