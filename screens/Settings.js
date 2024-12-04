import React, { useState, useEffect } from 'react';
import {
  Button, Form, Input, message, Space, Modal
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FaChartBar, FaUserFriends, FaLaptop, FaExclamationTriangle, FaCog } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../screens/firebaseconfig';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import './Settings.css';

const Settings = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userData, setUserData] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    avatar: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          message.error('Vui lòng đăng nhập');
          navigate('/');
          return;
        }

        const userDoc = await getDoc(doc(db, 'USERS', user.email));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          form.setFieldsValue({
            fullname: data.fullname || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            department: data.department || '',
          });
          if (data.avatar) {
            setImagePreview(data.avatar);
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
        message.error('Không thể tải thông tin người dùng');
      }
    };

    fetchUserData();
  }, [form, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      let imageUrl = userData.avatar;

      if (imagePreview && imagePreview !== userData.avatar) {
        const imageRef = ref(storage, `profileImages/${user.email}_profile.jpg`);
        await uploadString(imageRef, imagePreview.split(',')[1], 'base64', {
          contentType: 'image/jpeg'
        });
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(doc(db, 'USERS', user.email), {
        ...values,
        avatar: imageUrl
      });

      message.success('Cập nhật thông tin thành công');
      await fetchUserData();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

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
          <Link to="/customer">
            <FaUserFriends /> Quản lý người dùng
          </Link>
          <Link to="/device">
            <FaLaptop /> Quản lý thiết bị
          </Link>
          <Link to="/error">
            <FaExclamationTriangle /> Quản lý thiết bị lỗi
          </Link>
          <Link to="/settings" className="active">
            <FaCog /> Cài đặt
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <div className="header">
          <h2>Cài đặt tài khoản</h2>
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
            <UserOutlined className="user-icon" />
            {showUserMenu && (
              <div className="user-menu">
                <button onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>
        </div>

        <div className="settings-content">
          <div className="avatar-section">
            <div className="avatar-container">
              <img
                src={imagePreview || userData.avatar || '/user-default.png'}
                alt="Avatar"
                className="avatar-image"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="avatar-input"
                id="avatar-input"
              />
              <label htmlFor="avatar-input" className="avatar-label">
                Thay đổi ảnh
              </label>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            className="settings-form"
            initialValues={userData}
          >
            <Form.Item
              name="fullname"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="address"
              label="Địa chỉ"
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item
              name="department"
              label="Phòng ban"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cập nhật
                </Button>
                <Button onClick={() => form.resetFields()}>
                  Đặt lại
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
