import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Dropdown
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, StopOutlined } from '@ant-design/icons';
import { FaChartBar, FaUserFriends, FaLaptop, FaExclamationTriangle, FaCog, FaEdit, FaBan, FaUnlock } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../screens/firebaseconfig';
import './Customer.css';

const { Option } = Select;

const Customer = () => {
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  // Fetch users data
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'USERS'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users: ", error);
      message.error('Không thể tải dữ liệu người dùng');
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
      title: 'Họ và tên',
      dataIndex: 'fullname',
      key: 'fullname',
      width: '20%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
    },
    {
      title: 'Phòng',
      dataIndex: 'department',
      key: 'department',
      width: '20%',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: '15%',
      render: (role) => role === 'admin' ? 'Quản trị viên' : 'Người dùng'
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            style={{ backgroundColor: '#1890ff' }}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title={record.banned ? 
              "Bạn có chắc chắn muốn bỏ cấm người dùng này?" : 
              "Bạn có chắc chắn muốn cấm người dùng này?"}
            onConfirm={() => record.banned ? handleUnban(record) : handleBan(record)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger={!record.banned}
              style={{ backgroundColor: record.banned ? '#52c41a' : '#ff4d4f' }}
              icon={record.banned ? <FaUnlock /> : <FaBan />}
            />
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'banned',
      key: 'banned',
      width: '15%',
      render: (banned) => (
        <span style={{ color: banned ? '#ff4d4f' : '#52c41a' }}>
          {banned ? 'Đã bị cấm' : 'Đang hoạt động'}
        </span>
      )
    },
  ];

  // Handle CRUD operations
  const handleAdd = async (values) => {
    try {
      await addDoc(collection(db, 'USERS'), values);
      message.success('Thêm người dùng thành công');
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error("Error adding user: ", error);
      message.error('Không thể thêm người dùng');
    }
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleBan = async (record) => {
    try {
      await updateDoc(doc(db, 'USERS', record.id), {
        banned: true,
        bannedAt: new Date().toISOString()
      });
      message.success('Đã cấm người dùng thành công');
      fetchUsers();
    } catch (error) {
      console.error("Error banning user: ", error);
      message.error('Không thể cấm người dùng');
    }
  };

  const handleUnban = async (record) => {
    try {
      await updateDoc(doc(db, 'USERS', record.id), {
        banned: false,
        unbannedAt: new Date().toISOString()
      });
      message.success('Đã bỏ cấm người dùng thành công');
      fetchUsers();
    } catch (error) {
      console.error("Error unbanning user: ", error);
      message.error('Không thể bỏ cấm người dùng');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
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
          <Link to="/customer" className="active">
            <FaUserFriends /> Quản lý người dùng
          </Link>
          <Link to="/device">
            <FaLaptop /> Quản lý thiết bị
          </Link>
          <Link to="/error">
            <FaExclamationTriangle /> Quản lý thiết bị lỗi
          </Link>
          <Link to="/settings">
            <FaCog /> Cài đặt
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <div className="header">
          <h2>Quản lý người dùng</h2>
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
            placeholder="Tìm kiếm theo tên, email hoặc phòng"
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={users.filter(user => 
            user.fullname?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.department?.toLowerCase().includes(searchText.toLowerCase())
          )}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`
          }}
        />

        <Modal
          title={editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              if (editingUser) {
                try {
                  await updateDoc(doc(db, 'USERS', editingUser.id), values);
                  message.success('Cập nhật thành công');
                  setIsModalVisible(false);
                  fetchUsers();
                } catch (error) {
                  console.error("Error updating user: ", error);
                  message.error('Không thể cập nhật người dùng');
                }
              } else {
                handleAdd(values);
              }
            }}
          >
            <Form.Item
              name="fullname"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input disabled={editingUser} />
            </Form.Item>

            <Form.Item
              name="department"
              label="Phòng"
              rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
            >
              <Select>
                <Option value="Kế Toán">Kế Toán</Option>
                <Option value="Nhân sự">Nhân sự</Option>
                <Option value="Thiết Bị">Thiết Bị</Option>
                <Option value="Phó giám đốc">Phó giám đốc</Option>
                <Option value="Giám đốc">Giám đốc</Option>
                <Option value="Kỹ thuật">Kỹ thuật</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
            >
              <Select>
                <Option value="user">Người dùng</Option>
                <Option value="admin">Quản trị viên</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </Button>
                <Button onClick={handleCancel}>Hủy</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Customer;
