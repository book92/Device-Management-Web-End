import React, { useState, useEffect, useRef } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Dropdown, Image
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, StopOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { FaChartBar, FaUserFriends, FaLaptop, FaExclamationTriangle, FaCog } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../screens/firebaseconfig';
import './Device.css';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../screens/firebaseconfig';
import * as QRCodeLib from 'qrcode';
import QRCode from 'qrcode.react';

const { Option } = Select;

const Device = () => {
    
  const [devices, setDevices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingDevice, setEditingDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const [qrValue, setQrValue] = useState('');
  const qrRef = useRef(null);
  const [specifications, setSpecifications] = useState({});
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [editingSpec, setEditingSpec] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDepartmentModalVisible, setIsDepartmentModalVisible] = useState(false);
  const [departmentForm] = Form.useForm();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [tempQRCanvas, setTempQRCanvas] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Fetch devices data
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'DEVICES'));
      const devicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Fetched devices:", devicesData);
      setDevices(devicesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching devices: ", error);
      message.error('Không thể tải dữ liệu thiết bị');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'DEPARTMENTS'));
      const departmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setDepartments(departmentsData);
    } catch (error) {
      console.error("Error fetching departments: ", error);
      message.error('Không thể tải danh sách phòng');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'USERS'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().fullname || doc.data().name || 'Không có tên',
        email: doc.data().email
      }));
      console.log('Fetched users:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users: ", error);
      message.error('Không thể tải danh sách người dùng');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: '5%',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Tên thiết bị',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
    },
    {
      title: 'Phòng',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: '15%',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
    },
    {
      title: 'Thông số kỹ thuật',
      key: 'specifications',
      width: '20%',
      render: (_, record) => (
        <div>
          {record.specifications && Object.entries(record.specifications).map(([key, value]) => (
            <div key={key}>
              {key}: {value}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Người dùng',
      dataIndex: 'user',
      key: 'user',
      width: '15%',
      render: (email) => {
        const user = users.find(u => u.email === email);
        return user ? `${user.name} - ${email}` : email;
      }
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: '15%',
    },
    {
      title: 'Mã QR',
      key: 'qrCode',
      width: '15%',
      render: (_, record) => {
        const qrData = createQRData(record);
        const baseUrl = 'https://book92.github.io/Lab1_P1/diviceinfo.html';
        const qrUrl = `${baseUrl}?data=${encodeURIComponent(JSON.stringify(qrData))}`;

        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {record.image ? (
              <Image 
                src={record.image}
                alt="QR Code"
                width={200}
                height={200}
                style={{ margin: '10px 0' }}
                preview={{
                  maskClassName: 'customize-mask',
                  mask: <div>
                    <EyeOutlined />
                    <span style={{ marginLeft: 8 }}>Xem</span>
                  </div>
                }}
                key={`qr-${record.id}-${Date.now()}`}
              />
            ) : (
              <QRCode
                value={qrUrl}
                size={200}
                level="H"
                style={{ margin: '10px 0' }}
              />
            )}
          </div>
        );
      }
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
            title="Xóa thiết bị"
            description="Bạn có chắc chắn muốn xóa thiết bị này?"
            onConfirm={() => handleDelete(record)}
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
    }
  ];

  // Hàm tạo QR data chuẩn
  const createQRData = (deviceData) => {
    return {
      id: deviceData.id,
      name: deviceData.name,
      user: deviceData.user,
      type: deviceData.type,
      specs: deviceData.specifications || {},
      notes: deviceData.note || '',
      department: deviceData.departmentName
    };
  };

  // Handle CRUD operations
  const handleAdd = async (values) => {
    try {
      setLoading(true);
      
      // Validate input data
      if (!values.name || !values.departmentName || !values.type || !values.user) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }

      // Kiểm tra thiết bị tồn tại
      const existingDeviceSnapshot = await getDocs(
        query(
          collection(db, 'DEVICES'),
          where('name', '==', values.name),
          where('departmentName', '==', values.departmentName)
        )
      );

      if (!existingDeviceSnapshot.empty) {
        message.error('Tên thiết bị đã tồn tại trong phòng này');
        setLoading(false);
        return;
      }

      // Tìm email của user được chọn
      const userEmail = values.user; // Đây là email người dùng từ form

      // Tạo device data với đầy đủ thông tin
      const deviceData = {
        name: values.name,
        departmentName: values.departmentName,
        type: values.type,
        user: values.user,
        userEmail: userEmail, // Thêm email người dùng
        specifications: specifications || {},
        note: values.note || '',
        createdAt: new Date().toISOString()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'DEVICES'), deviceData);

      // Tạo QR data
      const qrData = createQRData({
        id: docRef.id,
        name: values.name,
        user: values.user,
        type: values.type,
        specifications: specifications || {},
        note: values.note || '',
        departmentName: values.departmentName
      });

      // Tạo URL cho QR
      const baseUrl = 'https://book92.github.io/Lab1_P1/diviceinfo.html';
      const encodedData = encodeURIComponent(JSON.stringify(qrData));
      const qrUrl = `${baseUrl}?data=${encodedData}`;

      // Tạo QR code
      const qrCanvas = document.createElement('canvas');
      await QRCodeLib.toCanvas(qrCanvas, qrUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Convert canvas to base64
      const qrImage = qrCanvas.toDataURL('image/png');
      const qrImageData = qrImage.split(',')[1];

      // Upload to Firebase Storage
      const fileName = `QR/${docRef.id}_${Date.now()}.png`;
      const storageRef = ref(storage, fileName);
      
      await uploadString(storageRef, qrImageData, 'base64', {
        contentType: 'image/png'
      });
      
      // Get download URL
      const qrLink = await getDownloadURL(storageRef);

      // Update Firestore document with QR image URL
      await updateDoc(doc(db, 'DEVICES', docRef.id), {
        id: docRef.id,
        image: qrLink
      });

      // Add device type if new
      const deviceTypeSnapshot = await getDocs(
        query(
          collection(db, 'DEVICETYPE'),
          where('name', '==', values.type.toLowerCase())
        )
      );

      if (deviceTypeSnapshot.empty) {
        await addDoc(collection(db, 'DEVICETYPE'), {
          name: values.type
        });
      }

      message.success('Thêm thiết bị thành công');
      setIsModalVisible(false);
      form.resetFields();
      setSpecifications({});
      await fetchDevices();

    } catch (error) {
      console.error("Error:", error);
      message.error('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingDevice(record);
    setSpecifications(record.specifications || {});
    form.setFieldsValue({
      ...record
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingDevice(null);
    form.resetFields();
  };

  // Thêm hàm xử lý đng xuất
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

  // Thêm useEffect để log devices khi có thay đổi
  useEffect(() => {
    console.log("Current devices:", devices);
  }, [devices]);

  // Thêm hàm download QR code
  const handleDownloadQR = (record) => {
    const canvas = document.querySelector(`canvas[data-id="${record.id}"]`);
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.download = `QR-${record.name}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Hàm tạo giá trị QR mới
  const updateQRValue = (deviceData) => {
    const qrData = {
      id: deviceData.id,
      name: deviceData.name,
      user: deviceData.user,
      type: deviceData.type,
      specs: deviceData.specifications,
      notes: deviceData.note,
      department: deviceData.departmentName
    };
    const encodedData = encodeURIComponent(JSON.stringify(qrData));
    const qrUrl = `https://book92.github.io/Lab1_P1/diviceinfo.html?data=${encodedData}`;
    setQrValue(qrUrl);
  };

  // Hàm xử lý thêm thông số
  const handleAddSpecification = () => {
    if (!newSpecKey || !newSpecValue) {
      message.error('Vui lòng nhập đầy đủ thông tin thông số');
      return;
    }

    setSpecifications(prev => ({
      ...prev,
      [newSpecKey]: newSpecValue
    }));
    
    setNewSpecKey('');
    setNewSpecValue('');
    message.success('Đã thêm thông số kỹ thuật');
  };

  // Hàm xử lý sửa thông số
  const handleEditSpecification = (key, value) => {
    setEditingSpec({ oldKey: key, key: key, value: value });
  };

  // Hàm cập nhật thông số
  const handleUpdateSpecification = () => {
    if (editingSpec) {
      setSpecifications(prevSpecs => {
        const newSpecs = { ...prevSpecs };
        if (editingSpec.oldKey !== editingSpec.key) {
          delete newSpecs[editingSpec.oldKey];
        }
        newSpecs[editingSpec.key] = editingSpec.value;
        return newSpecs;
      });
      setEditingSpec(null);
    }
  };

  // Hàm xóa thông số
  const handleRemoveSpecification = (key) => {
    setSpecifications(prev => {
      const newSpecs = { ...prev };
      delete newSpecs[key];
      return newSpecs;
    });
    message.success('Đã xóa thông số kỹ thuật');
  };

  // Cập nhật handleSave
  const handleSave = async (values) => {
    try {
      setLoading(true);

      if (!editingDevice) {
        message.error('Không tìm thấy thiết bị đang chỉnh sửa');
        return;
      }

      // Delete old QR image from storage if it exists
      if (editingDevice.image) {
        try {
          // Extract the file path from the image URL
          const oldImageUrl = new URL(editingDevice.image);
          const oldImagePath = decodeURIComponent(oldImageUrl.pathname.split('/o/')[1].split('?')[0]);
          
          // Create reference to old image and delete it
          const oldImageRef = ref(storage, oldImagePath);
          await deleteObject(oldImageRef);
          console.log('Old QR image deleted successfully');
        } catch (error) {
          console.error('Error deleting old QR image:', error);
          // Continue with update even if delete fails
        }
      }

      const updatedDeviceData = {
        name: values.name,
        departmentName: values.departmentName,
        type: values.type,
        user: values.user,
        specifications: specifications,
        note: values.note || '',
        updatedAt: new Date().toISOString()
      };

      // Update Firestore document
      const deviceRef = doc(db, 'DEVICES', editingDevice.id);
      await updateDoc(deviceRef, updatedDeviceData);

      // Create new QR code
      const qrData = createQRData({
        id: editingDevice.id,
        name: values.name,
        user: values.user,
        type: values.type,
        specifications: specifications,
        note: values.note,
        departmentName: values.departmentName
      });

      // Rest of your existing QR generation code...
      const baseUrl = 'https://book92.github.io/Lab1_P1/diviceinfo.html';
      const encodedData = encodeURIComponent(JSON.stringify(qrData));
      const qrUrl = `${baseUrl}?data=${encodedData}`;

      // Create QR canvas
      const qrCanvas = document.createElement('canvas');
      await QRCodeLib.toCanvas(qrCanvas, qrUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Convert to base64 and upload new QR
      const qrImage = qrCanvas.toDataURL('image/png');
      const qrImageData = qrImage.split(',')[1];

      const newFileName = `QR/${editingDevice.id}_${Date.now()}.png`;
      const qrRef = ref(storage, newFileName);
      
      await uploadString(qrRef, qrImageData, 'base64');
      const newQRLink = await getDownloadURL(qrRef);

      // Update document with new QR image URL
      await updateDoc(deviceRef, {
        image: newQRLink
      });

      message.success('Cập nhật thiết bị thành công');
      setIsModalVisible(false);
      form.resetFields();
      setSpecifications({});
      await fetchDevices();

    } catch (error) {
      console.error('Error:', error);
      message.error('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm xử lý thêm phòng mới
  const handleAddDepartment = async (values) => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'DEPARTMENTS'), {
        name: values.departmentName,
        createdAt: new Date().toISOString()
      });
      message.success('Thêm phòng mới thành công');
      setIsDepartmentModalVisible(false);
      departmentForm.resetFields();
      await fetchDepartments();
    } catch (error) {
      console.error('Lỗi khi thêm phòng:', error);
      message.error('Không thể thêm phòng mi');
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm xử lý xóa
  const handleDelete = async (record) => {
    try {
      setLoading(true);
      
      // 1. Xóa QR code từ Storage nếu có
      if (record.image) {
        try {
          // Lấy path của QR code từ URL
          const imageUrl = new URL(record.image);
          const imagePath = decodeURIComponent(imageUrl.pathname.split('/o/')[1].split('?')[0]);
          
          // Tạo reference và xóa file
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
          console.log('QR code deleted from storage successfully');
        } catch (error) {
          console.error('Error deleting QR from storage:', error);
          message.error('Có lỗi khi xóa QR code: ' + error.message);
        }
      }

      // 2. Xóa document từ Firestore
      await deleteDoc(doc(db, 'DEVICES', record.id));
      
      message.success('Xóa thiết bị thành công');
      
      // 3. Cập nhật state local để refresh UI ngay lập tức
      setDevices(prevDevices => prevDevices.filter(device => device.id !== record.id));
      
      // 4. Refresh danh sách thiết bị
      await fetchDevices();

    } catch (error) {
      console.error('Error deleting device:', error);
      message.error('Không thể xóa thiết bị: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm để lấy thông tin người dùng
  const getUserInfo = async (email) => {
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, 'USERS'), where('email', '==', email))
      );
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        return {
          name: userData.fullname || userData.name,
          email: userData.email
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  };

  // Cập nhật hàm handleUpdate
  const handleUpdate = async (values) => {
    try {
      setLoading(true);
      
      if (!editingDevice) return;

      // 1. Xóa QR code cũ từ storage nếu có
      if (editingDevice.image) {
        try {
          const oldImageUrl = new URL(editingDevice.image);
          const oldImagePath = decodeURIComponent(oldImageUrl.pathname.split('/o/')[1].split('?')[0]);
          const oldImageRef = ref(storage, oldImagePath);
          await deleteObject(oldImageRef);
          console.log('Old QR code deleted successfully');
        } catch (error) {
          console.error('Error deleting old QR:', error);
        }
      }

      // 2. Chuẩn bị dữ liệu cập nhật
      const updatedDeviceData = {
        name: values.name,
        type: values.type,
        departmentName: values.departmentName,
        user: values.user,
        specifications: specifications,
        note: values.note,
      };

      // 3. Cập nhật thông tin thiết bị trong Firestore
      const deviceRef = doc(db, 'DEVICES', editingDevice.id);
      await updateDoc(deviceRef, updatedDeviceData);

      // 4. Tạo mã QR mới
      const qrData = createQRData({ id: editingDevice.id, ...updatedDeviceData });
      const baseUrl = 'https://book92.github.io/Lab1_P1/diviceinfo.html';
      const encodedData = encodeURIComponent(JSON.stringify(qrData));
      const qrUrl = `${baseUrl}?data=${encodedData}`;

      // 5. Tạo QR canvas và chuyển thành base64
      const qrCanvas = document.createElement('canvas');
      await QRCodeLib.toCanvas(qrCanvas, qrUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // 6. Upload QR mới vào storage
      const qrImageData = qrCanvas.toDataURL('image/png').split(',')[1];
      const fileName = `QR/${editingDevice.id}_${Date.now()}.png`;
      const newStorageRef = ref(storage, fileName);
      await uploadString(newStorageRef, qrImageData, 'base64', {
        contentType: 'image/png'
      });
      const newQRLink = await getDownloadURL(newStorageRef);

      // 7. Cập nhật link QR mới vào Firestore
      await updateDoc(deviceRef, {
        image: newQRLink,
      });

      // 8. Cập nhật state local
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === editingDevice.id 
            ? { 
                ...device, 
                ...updatedDeviceData,
                image: newQRLink 
              }
            : device
        )
      );

      message.success('Cập nhật thiết bị thành công');
      setEditModalVisible(false);
      editForm.resetFields();
      setSpecifications({});
      await fetchDevices();

    } catch (error) {
      console.error('Error updating device:', error);
      message.error('Có lỗi xảy ra khi cập nhật thiết bị: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm filter devices được cập nhật
  const filterDevices = (devices, keyword) => {
    if (!keyword || keyword.trim() === '') return devices;
    
    const searchTerms = keyword.toLowerCase().trim().split(' ');
    
    return devices.filter(device => {
      const deviceData = {
        name: (device.name || '').toLowerCase(),
        type: (device.type || '').toLowerCase(),
        departmentName: (device.departmentName || '').toLowerCase(),
        user: (device.user || '').toLowerCase(),
        note: (device.note || '').toLowerCase(),
        specs: device.specifications ? 
          Object.entries(device.specifications)
            .map(([key, value]) => `${key} ${value}`)
            .join(' ')
            .toLowerCase() 
          : ''
      };

      // Kiểm tra xem tất cả các từ khóa có tồn tại trong ít nhất một trường dữ liệu không
      return searchTerms.every(term =>
        deviceData.name.includes(term) ||
        deviceData.type.includes(term) ||
        deviceData.departmentName.includes(term) ||
        deviceData.user.includes(term) ||
        deviceData.note.includes(term) ||
        deviceData.specs.includes(term)
      );
    });
  };

  return (
    <div className="device-container">
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
          <Link to="/device"className="active">
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
          <h2>Quản lý thiết bị</h2>
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
            placeholder="Tìm kiếm theo tên, loại, phòng, người dùng..."
            value={searchKeyword}
            onChange={(e) => {
              const value = e.target.value;
              setSearchKeyword(value);
              setSearchText(value); // Giữ lại để tương thích với code cũ nếu cần
            }}
            style={{ 
              width: 400,
              marginBottom: 16 
            }}
            allowClear
            enterButton
          />
        </div>

        <div style={{ 
          marginBottom: 16, 
          display: 'flex', 
          justifyContent: 'flex-start',
          gap: '10px' 
        }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingDevice(null);
              setIsModalVisible(true);
              form.resetFields();
            }}
            style={{ 
              backgroundColor: '#1890ff',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Thêm thiết bị mới
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsDepartmentModalVisible(true);
              departmentForm.resetFields();
            }}
            style={{ 
              backgroundColor: '#52c41a',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Thêm phòng mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filterDevices(devices, searchKeyword)}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thiết bị`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
        />

        <Modal
          title={editingDevice ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              if (editingDevice) {
                handleSave(values);
              } else {
                handleAdd(values);
              }
            }}
          >
            <Form.Item
              name="name"
              label="Tên thiết bị"
              rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="departmentName"
              label="Phòng"
              rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
            >
              <Select placeholder="Chọn phòng">
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="type"
              label="Loại thiết bị"
              rules={[{ required: true, message: 'Vui lòng nhập loại thiết bị' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Thông số kỹ thuật">
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                  {editingSpec?.oldKey === key ? (
                    <Space>
                      <Input
                        value={editingSpec.key}
                        onChange={e => setEditingSpec({...editingSpec, key: e.target.value})}
                      />
                      <Input
                        value={editingSpec.value}
                        onChange={e => setEditingSpec({...editingSpec, value: e.target.value})}
                      />
                      <Button onClick={handleUpdateSpecification} type="primary">
                        Lưu
                      </Button>
                    </Space>
                  ) : (
                    <>
                      <span>{key}: {value}</span>
                      <Space style={{ marginLeft: 'auto' }}>
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditSpecification(key, value)}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveSpecification(key)}
                        />
                      </Space>
                    </>
                  )}
                </div>
              ))}

              <Space style={{ marginTop: '8px' }}>
                <Input
                  placeholder="Tên thông số"
                  value={newSpecKey}
                  onChange={e => setNewSpecKey(e.target.value)}
                />
                <Input
                  placeholder="Giá trị"
                  value={newSpecValue}
                  onChange={e => setNewSpecValue(e.target.value)}
                />
                <Button type="primary" onClick={handleAddSpecification}>
                  Thêm
                </Button>
              </Space>
            </Form.Item>

            <Form.Item
              name="user"
              label="Người dùng"
              rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
            >
              <Select 
                placeholder="Chọn người dùng"
                optionFilterProp="children"
                showSearch
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {users.map(user => (
                  <Option key={user.id} value={user.email}>
                    {`${user.name || user.fullname} - ${user.email}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="note"
              label="Ghi chú"
            >
              <Input.TextArea 
                rows={4}
                placeholder="Nhập ghi chú"
                style={{ 
                  width: '100%',
                  marginBottom: '10px',
                  resize: 'vertical'
                }}
              />
            </Form.Item>

            <Form.Item name="qrCode" label="Mã QR">
              {editingDevice && (
                <canvas
                  ref={async (canvas) => {
                    if (canvas) {
                      const qrData = {
                        id: editingDevice.id,
                        name: form.getFieldValue('name') || editingDevice.name,
                        user: form.getFieldValue('user') || editingDevice.user,
                        type: form.getFieldValue('type') || editingDevice.type,
                        specs: specifications,
                        notes: form.getFieldValue('note') || editingDevice.note,
                        department: form.getFieldValue('departmentName') || editingDevice.departmentName
                      };
                      const qrUrl = `https://book92.github.io/Lab1_P1/diviceinfo.html?data=${encodeURIComponent(JSON.stringify(qrData))}`;
                      await QRCodeLib.toCanvas(canvas, qrUrl, {
                        width: 200,
                        margin: 2,
                        errorCorrectionLevel: 'H'
                      });
                    }
                  }}
                  width={200}
                  height={200}
                  style={{ margin: '10px 0' }}
                />
              )}
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingDevice ? 'Cập nhật' : 'Thêm mới'}
                </Button>
                <Button onClick={handleCancel}>Hủy</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Thêm phòng mới"
          open={isDepartmentModalVisible}
          onCancel={() => setIsDepartmentModalVisible(false)}
          footer={null}
        >
          <Form
            form={departmentForm}
            layout="vertical"
            onFinish={handleAddDepartment}
          >
            <Form.Item
              name="departmentName"
              label="Tên phòng"
              rules={[
                { required: true, message: 'Vui lòng nhập tên phòng' },
                { min: 3, message: 'Tên phòng phải có ít nhất 3 ký tự' }
              ]}
            >
              <Input placeholder="Nhập tên phòng" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Thêm mới
                </Button>
                <Button onClick={() => setIsDepartmentModalVisible(false)}>
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

export default Device;
  