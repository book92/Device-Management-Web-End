import React, { useState, useEffect } from 'react';
import { auth, db } from '../screens/firebaseconfig';
import { doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';
import { FaChartBar, FaUserFriends, FaLaptop, FaExclamationTriangle, FaCog, FaBars, FaChevronLeft, FaExclamationCircle, FaDesktop, FaBuilding, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { collection, onSnapshot } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(true);
    const [userData, setUserData] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [errorStats, setErrorStats] = useState({});
    const [roomCountsUser, setRoomCountsUser] = useState({});
    const [roomCountsDevice, setRoomCountsDevice] = useState({});
    const [userCount, setUserCount] = useState({});
    const [detailedErrorStats, setDetailedErrorStats] = useState([]);
    const [detailedUserStats, setDetailedUserStats] = useState([]);
    const [detailedDeviceStats, setDetailedDeviceStats] = useState([]);
    const [detailedUserDeviceStats, setDetailedUserDeviceStats] = useState([]);
    const [selectedStartDate, setSelectedStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [selectedEndDate, setSelectedEndDate] = useState(new Date());

    useEffect(() => {
        const fetchUserData = async (user) => {
            try {
                const userDoc = await getDoc(doc(db, 'USERS', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate('/');
            } else {
                fetchUserData(user);
            }
        });

        // Thêm listener cho collection ERROR
        const unsubscribeErrors = onSnapshot(collection(db, 'ERROR'), (snapshot) => {
            const errorData = {};
            snapshot.docs.forEach((doc) => {
                const error = doc.data();
                const deviceName = error.deviceName;
                if (deviceName) {
                    errorData[deviceName] = (errorData[deviceName] || 0) + 1;
                }
            });
            setErrorStats(errorData);
        });

        // Listener cho thống kê người dùng theo phòng
        const unsubscribeUserRoom = onSnapshot(collection(db, 'USERS'), (snapshot) => {
            const roomCountTempUser = {};
            snapshot.docs.forEach((doc) => {
                const user = doc.data();
                const department = user.department;
                roomCountTempUser[department] = (roomCountTempUser[department] || 0) + 1;
            });
            setRoomCountsUser(roomCountTempUser);
        });

        // Listener cho thống kê thiết bị theo phòng
        const unsubscribeDeviceRoom = onSnapshot(collection(db, 'DEVICES'), (snapshot) => {
            const roomCountTempDevice = {};
            snapshot.docs.forEach((doc) => {
                const device = doc.data();
                const department = device.departmentName;
                roomCountTempDevice[department] = (roomCountTempDevice[department] || 0) + 1;
            });
            setRoomCountsDevice(roomCountTempDevice);
        });

        // Listener cho thống kê thiết bị theo người dùng
        const unsubscribeDeviceUser = onSnapshot(collection(db, 'DEVICES'), (snapshot) => {
            const userCountTemp = {};
            snapshot.docs.forEach((doc) => {
                const device = doc.data();
                const user = device.user;
                if (user) { // Chỉ đếm nếu có người dùng
                    userCountTemp[user] = (userCountTemp[user] || 0) + 1;
                }
            });
            setUserCount(userCountTemp);
        });

        // Listener cho thống kê lỗi chi tiết
        const unsubscribeDetailedErrors = onSnapshot(collection(db, 'ERROR'), (snapshot) => {
            const errorDetails = [];
            snapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                // Kiểm tra và định dạng ngày tháng
                const reportDate = data.reportDate ? new Date(data.reportDate.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A';
                const fixDate = data.fixDate ? new Date(data.fixDate.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A';
                
                errorDetails.push({
                    stt: index + 1,
                    deviceName: data.deviceName || 'N/A',
                    deviceRoom: data.deviceRoom || 'N/A',
                    userName: data.fullname || 'N/A',
                    reportedBy: data.reportedBy || 'N/A',
                    reportDate: reportDate,
                    fixDate: fixDate,
                    status: data.status || 'N/A',
                    description: data.description || 'N/A',
                    errorCount: 1
                });
            });
            setDetailedErrorStats(errorDetails);
        });

        // Listener cho thống kê người dùng theo phòng chi tiết
        const unsubscribeDetailedUsers = onSnapshot(collection(db, 'USERS'), (snapshot) => {
            const departments = {};
            snapshot.docs.forEach(doc => {
                const userData = doc.data();
                const dept = userData.department;
                if (!departments[dept]) {
                    departments[dept] = {
                        department: dept,
                        userCount: 0,
                        users: []
                    };
                }
                departments[dept].userCount++;
                departments[dept].users.push({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                });
            });
            setDetailedUserStats(Object.values(departments));
        });

        return () => {
            unsubscribe();
            unsubscribeErrors();
            unsubscribeUserRoom();
            unsubscribeDeviceRoom();
            unsubscribeDeviceUser();
            unsubscribeDetailedErrors();
            unsubscribeDetailedUsers();
        };
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
        }
    };

    const toggleDrawer = () => {
        setIsExpanded(!isExpanded);
    };

    // Hàm to data cho biểu đồ
    const createChartData = (data, label, backgroundColor = 'rgba(53, 162, 235, 0.5)') => ({
        labels: Object.keys(data),
        datasets: [{
            label: label,
            data: Object.values(data),
            backgroundColor,
            borderWidth: 0,
            borderRadius: 4,
        }],
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    font: { size: 11 }
                },
                grid: {
                    display: true,
                    color: '#f0f0f0'
                }
            },
            x: {
                ticks: {
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        },
        barThickness: 15,
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

    const fetchAdditionalData = async (data, title, startDate, endDate) => {
        try {
            switch(title) {
                case "Thống kê lỗi theo thiết bị":
                    const errorSnapshot = await getDocs(collection(db, 'ERROR'));
                    const errors = [];
                    
                    // Tạo map để đếm số lỗi cho mỗi thiết bị
                    const errorCountMap = {};
                    errorSnapshot.docs.forEach(doc => {
                        const error = doc.data();
                        const deviceName = error.deviceName;
                        errorCountMap[deviceName] = (errorCountMap[deviceName] || 0) + 1;
                    });
                    
                    for (const doc of errorSnapshot.docs) {
                        const error = doc.data();
                        const deviceName = error.deviceName;

                        // Lấy thông tin thiết bị
                        const deviceQuery = query(
                            collection(db, 'DEVICES'),
                            where('name', '==', deviceName)
                        );
                        const deviceSnapshot = await getDocs(deviceQuery);
                        const deviceData = !deviceSnapshot.empty ? deviceSnapshot.docs[0].data() : null;

                        // Format timestamp thành ngày
                        const formatTimestamp = (timestamp) => {
                            if (!timestamp) return 'N/A';
                            try {
                                if (timestamp.toDate) {
                                    return timestamp.toDate().toLocaleDateString('vi-VN');
                                }
                                if (typeof timestamp === 'string') {
                                    const date = new Date(timestamp);
                                    if (!isNaN(date.getTime())) {
                                        return date.toLocaleDateString('vi-VN');
                                    }
                                }
                                if (typeof timestamp === 'number') {
                                    return new Date(timestamp * 1000).toLocaleDateString('vi-VN');
                                }
                                if (timestamp.seconds) {
                                    return new Date(timestamp.seconds * 1000).toLocaleDateString('vi-VN');
                                }
                                return 'N/A';
                            } catch (error) {
                                console.error("Error formatting timestamp:", error);
                                return 'N/A';
                            }
                        };

                        // Xử lý ngày báo cáo và ngày sửa
                        const reportDate = error.reportday ? formatTimestamp(error.reportday) : 'N/A';
                        const fixDate = error.fixday ? formatTimestamp(error.fixday) : 'N/A';

                        errors.push({
                            deviceName: deviceName || 'N/A',
                            deviceRoom: deviceData?.departmentName || 'N/A',
                            userName: deviceData?.userEmail || 'N/A',
                            reportedBy: error.userreport || 'N/A',
                            reportDate: reportDate,
                            fixDate: fixDate,
                            status: error.state || 'Chưa sửa',
                            description: error.description || 'N/A',
                            errorCount: errorCountMap[deviceName] || 1 // Thêm số lỗi của thiết bị
                        });
                    }

                    // Sắp xếp theo số lỗi giảm dần
                    errors.sort((a, b) => b.errorCount - a.errorCount);

                    return errors;

                case "Thống kê người dùng theo phòng":
                    const userDeptSnapshot = await getDocs(collection(db, 'USERS'));
                    const departments = {};
                    
                    userDeptSnapshot.docs.forEach(doc => {
                        const user = doc.data();
                        const dept = user.department;
                        if (!departments[dept]) {
                            departments[dept] = {
                                department: dept,
                                userCount: 0,
                                users: []
                            };
                        }
                        departments[dept].userCount++;
                        departments[dept].users.push({
                            name: user.fullname || 'N/A',
                            email: user.email || 'N/A',
                            role: user.role || 'N/A'
                        });
                    });
                    return Object.values(departments);

                case "Thống kê thiết bị theo phòng":
                    const deviceDeptSnapshot = await getDocs(collection(db, 'DEVICES'));
                    const devicesByDept = {};
                    
                    deviceDeptSnapshot.docs.forEach(doc => {
                        const device = doc.data();
                        const dept = device.departmentName;
                        if (!devicesByDept[dept]) {
                            devicesByDept[dept] = {
                                department: dept,
                                deviceCount: 0,
                                devices: []
                            };
                        }
                        devicesByDept[dept].deviceCount++;
                        devicesByDept[dept].devices.push({
                            name: device.name || 'N/A',
                            type: device.type || 'N/A',
                            user: device.user || 'N/A',
                            email: device.userEmail || 'N/A'
                        });
                    });
                    return Object.values(devicesByDept);

                case "Thống kê thiết bị theo người dùng":
                    const deviceUserSnapshot = await getDocs(collection(db, 'DEVICES'));
                    const userListSnapshot = await getDocs(collection(db, 'USERS'));
                    const devicesByUser = [];
                    const userMap = {};

                    // Tạo map user email -> user info
                    userListSnapshot.docs.forEach(doc => {
                        const userData = doc.data();
                        userMap[userData.email] = {
                            fullname: userData.fullname || userData.name || 'N/A',
                            email: userData.email || 'N/A',
                            department: userData.department || 'N/A'
                        };
                    });

                    // Nhóm thiết bị theo người dùng
                    const devicesByUserMap = {};
                    deviceUserSnapshot.docs.forEach(doc => {
                        const device = doc.data();
                        const userEmail = device.userEmail || device.user;
                        
                        if (userEmail) {
                            const userInfo = userMap[userEmail] || {
                                fullname: userEmail,
                                email: userEmail,
                                department: 'N/A'
                            };

                            if (!devicesByUserMap[userEmail]) {
                                devicesByUserMap[userEmail] = {
                                    user: userInfo.fullname,
                                    email: userEmail,
                                    deviceCount: 0,
                                    devices: []
                                };
                            }

                            devicesByUserMap[userEmail].deviceCount++;
                            devicesByUserMap[userEmail].devices.push({
                                name: device.name || 'N/A',
                                type: device.type || 'N/A',
                                department: device.departmentName || userInfo.department || 'N/A',
                                specifications: formatSpecifications(device.specifications),
                                note: device.note || 'N/A'
                            });
                        }
                    });

                    return Object.values(devicesByUserMap);
            }
        } catch (error) {
            console.error("Error in fetchAdditionalData:", error);
            return [];
        }
    };

    const handleExportErrors = async () => {
        try {
            const errorSnapshot = await getDocs(collection(db, 'ERROR'));
            const errors = errorSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
            const errorDetails = [];

            for (const error of errors) {
                const deviceQuery = query(
                    collection(db, 'DEVICES'),
                    where('name', '==', error.deviceName)
                );
                const deviceSnapshot = await getDocs(deviceQuery);
                let deviceInfo = null;
                if (!deviceSnapshot.empty) {
                    deviceInfo = deviceSnapshot.docs[0].data();
                }

                errorDetails.push({
                    deviceName: error.deviceName || 'N/A',
                    deviceRoom: deviceInfo?.departmentName || 'N/A',
                    userreport: deviceInfo?.userreport || 'N/A',
                    reportedBy: error.userreport || 'N/A',
                    reportDate: error.reportday ? new Date(error.reportday).toLocaleDateString('vi-VN') : 'N/A',
                    fixDate: error.fixday ? new Date(error.fixday).toLocaleDateString('vi-VN') : 'N/A',
                    status: error.state || 'N/A',
                    description: error.description || 'N/A'
                });
            }

            exportToExcel(errorDetails, "errors");
        } catch (error) {
            console.error("Error fetching error data:", error);
        }
    };

    const handleExportUsersByRoom = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'USERS'));
            const users = usersSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
            const departmentData = {};

            users.forEach(user => {
                if (!departmentData[user.department]) {
                    departmentData[user.department] = {
                        department: user.department,
                        users: []
                    };
                }
                departmentData[user.department].users.push({
                    name: user.fullname || 'N/A',
                    email: user.email || 'N/A',
                    role: user.role || 'N/A'
                });
            });

            exportToExcel(Object.values(departmentData), "users");
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const handleExportDevicesByRoom = async () => {
        try {
            const devicesSnapshot = await getDocs(collection(db, 'DEVICES'));
            const devices = devicesSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
            const departmentData = {};

            devices.forEach(device => {
                if (!departmentData[device.departmentName]) {
                    departmentData[device.departmentName] = {
                        department: device.departmentName,
                        devices: []
                    };
                }
                departmentData[device.departmentName].devices.push({
                    name: device.name || 'N/A',
                    type: device.type || 'N/A',
                    user: device.user || 'N/A',
                    email: device.userEmail || 'N/A'
                });
            });

            exportToExcel(Object.values(departmentData), "devices");
        } catch (error) {
            console.error("Error fetching device data:", error);
        }
    };

    const handleExportDevicesByUser = async () => {
        try {
            const devicesSnapshot = await getDocs(collection(db, 'DEVICES'));
            const devices = devicesSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
            const userData = {};

            devices.forEach(device => {
                if (!userData[device.user]) {
                    userData[device.user] = {
                        user: device.user,
                        devices: []
                    };
                }
                userData[device.user].devices.push({
                    name: device.name || 'N/A',
                    type: device.type || 'N/A',
                    department: device.departmentName || 'N/A',
                    specifications: formatSpecifications(device.specifications),
                    image: device.image || 'N/A',
                    note: device.note || 'N/A'
                });
            });

            exportToExcel(Object.values(userData), "devicesByUser");
        } catch (error) {
            console.error("Error fetching device-user data:", error);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleExportToExcel = (data, title) => {
        if (title === "Thống kê lỗi theo thiết bị") {
            const confirmExport = window.confirm(
                `Chọn khoảng thời gian để xuất dữ liệu\n\nTừ ngày: ${formatDate(selectedStartDate)}\nĐến ngày: ${formatDate(selectedEndDate)}`
            );

            if (confirmExport) {
                const timeRangeChoice = window.confirm(
                    "Bạn muốn chọn khoảng thời gian khác không?"
                );

                if (timeRangeChoice) {
                    const choice = window.prompt(
                        "Chọn khoảng thời gian:\n1. 1 tuần gần đây\n2. 1 tháng gần đây\n3. 3 tháng gần đây"
                    );

                    const end = new Date();
                    let start = new Date();

                    switch (choice) {
                        case "1":
                            start.setDate(end.getDate() - 7);
                            break;
                        case "2":
                            start.setMonth(end.getMonth() - 1);
                            break;
                        case "3":
                            start.setMonth(end.getMonth() - 3);
                            break;
                        default:
                            return;
                    }

                    setSelectedStartDate(start);
                    setSelectedEndDate(end);
                    handleExportData(data, title, start, end);
                } else {
                    handleExportData(data, title, selectedStartDate, selectedEndDate);
                }
            }
        } else {
            const confirmExport = window.confirm(
                "Bạn muốn xuất excel bảng thống kê?"
            );
            if (confirmExport) {
                handleExportData(data, title);
            }
        }
    };

    const handleExportData = async (data, title, startDate, endDate) => {
        try {
            const additionalData = await fetchAdditionalData(data, title, startDate, endDate);
            let excelData;

            switch (title) {
                case "Thống kê lỗi theo thiết bị":
                    excelData = [
                        ['STT', 'Tên thiết bị', 'Phòng', 'Người dùng', 'Người báo lỗi', 'Ngày báo cáo', 'Ngày sửa', 'Tình trạng', 'Mô tả', 'Tổng số lỗi']
                    ];
                    additionalData.forEach((item, index) => {
                        excelData.push([
                            index + 1,
                            item.deviceName,
                            item.deviceRoom,
                            item.userName,
                            item.reportedBy,
                            item.reportDate,
                            item.fixDate,
                            item.status,
                            item.description,
                            item.errorCount
                        ]);
                    });
                    break;

                case "Thống kê người dùng theo phòng":
                    excelData = [
                        ['STT', 'Phòng', 'Số người dùng', 'Tên người dùng', 'Email', 'Vai trò']
                    ];
                    additionalData.forEach((dept, deptIndex) => {
                        if (dept.users.length === 0) {
                            excelData.push([deptIndex + 1, dept.department, dept.userCount, 'N/A', 'N/A', 'N/A']);
                        } else {
                            dept.users.forEach((user, userIndex) => {
                                excelData.push([
                                    deptIndex + 1,
                                    dept.department,
                                    dept.userCount,
                                    user.name,
                                    user.email,
                                    user.role
                                ]);
                            });
                        }
                    });
                    break;

                case "Thống kê thiết bị theo phòng":
                    excelData = [
                        ['STT', 'Phòng', 'Số thiết bị', 'Tên thiết bị', 'Loại thiết bị', 'Người dùng', 'Email']
                    ];
                    additionalData.forEach((dept, deptIndex) => {
                        dept.devices.forEach((device) => {
                            excelData.push([
                                deptIndex + 1,
                                dept.department,
                                dept.deviceCount,
                                device.name,
                                device.type,
                                device.user,
                                device.email
                            ]);
                        });
                    });
                    break;

                case "Thống kê thiết bị theo người dùng":
                    excelData = [
                        ['STT', 'Người dùng', 'Email', 'Số thiết bị', 'Tên thiết bị', 'Loại thiết bị', 'Phòng', 'Thông số kỹ thuật', 'Ghi chú']
                    ];
                    let stt = 1;
                    additionalData.forEach((userInfo) => {
                        userInfo.devices.forEach((device) => {
                            excelData.push([
                                stt++,
                                userInfo.user,
                                userInfo.email,
                                userInfo.deviceCount,
                                device.name,
                                device.type,
                                device.department,
                                device.specifications,
                                device.note
                            ]);
                        });
                    });
                    break;
            }

            // Tạo workbook và worksheet
            const ws = XLSX.utils.aoa_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

            // Định dạng cột
            const columnWidths = [
                { wch: 5 },   // STT
                { wch: 25 },  // Tên thiết bị
                { wch: 20 },  // Phòng
                { wch: 25 },  // Người dùng
                { wch: 25 },  // Người báo lỗi
                { wch: 15 },  // Ngày báo cáo
                { wch: 15 },  // Ngày sửa
                { wch: 15 },  // Tình trạng
                { wch: 40 },  // Mô tả
                { wch: 12 }   // Tổng số lỗi
            ];
            ws['!cols'] = columnWidths;

            // Định dạng header
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: 0, c: C });
                if (!ws[address]) continue;
                ws[address].s = {
                    font: { bold: true },
                    alignment: { horizontal: 'center' },
                    fill: { fgColor: { rgb: "FFFF00" } }
                };
            }

            // Xuất file Excel
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
            const fileName = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
            saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), fileName);

        } catch (error) {
            console.error("Error exporting to Excel:", error);
        }
    };

    // Hàm hỗ trợ
    const formatSpecifications = (specs) => {
        if (!specs || typeof specs !== 'object') return 'N/A';
        return Object.entries(specs)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    };

    const s2ab = (s) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    };

    return (
        <div className="dashboard">
            <div className="sidebar">
                <div className="logo">
                    <h2>Device Manager</h2>
                </div>
                <nav>
                <Link to="/dashboard" className="active">
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
          <Link to="/settings">
            <FaCog /> Cài đặt
          </Link>
                </nav>
            </div>

            <div className="main">
                <header>
                    <div className="header-content">
                        <h1>Thống kê</h1>
                        <div className="user-info">
                            <div className="user-icon" onClick={() => setShowUserMenu(!showUserMenu)}>
                                <FaUser size={20} />
                            </div>
                            {showUserMenu && (
                                <div className="user-menu">
                                    <button onClick={handleLogout}>
                                        <FaSignOutAlt />
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="stats-overview">
                    <div className="stat-card">
                        <div className="stat-icon error">
                            <FaExclamationCircle />
                        </div>
                        <div className="stat-details">
                            <span className="stat-label">Tổng số lỗi</span>
                            <span className="stat-value">{Object.values(errorStats).reduce((a, b) => a + b, 0)}</span>
                        </div>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon users">
                            <FaUserFriends />
                        </div>
                        <div className="stat-details">
                            <span className="stat-label">Người dùng</span>
                            <span className="stat-value">{Object.values(roomCountsUser).reduce((a, b) => a + b, 0)}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon devices">
                            <FaDesktop />
                        </div>
                        <div className="stat-details">
                            <span className="stat-label">Thiết bị</span>
                            <span className="stat-value">{Object.values(roomCountsDevice).reduce((a, b) => a + b, 0)}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon departments">
                            <FaBuilding />
                        </div>
                        <div className="stat-details">
                            <span className="stat-label">Phòng ban</span>
                            <span className="stat-value">{Object.keys(roomCountsUser).length}</span>
                        </div>
                    </div>
                </div>

                <div className="charts-container">
                    <div className="chart-box">
                        <div className="chart-header">
                            <h3>Thống kê lỗi theo thiết bị</h3>
                            <button className="export-btn" onClick={() => handleExportToExcel(errorStats, "Thống kê lỗi theo thiết bị")}>
                                Xuất Excel
                            </button>
                        </div>
                        <div className="chart">
                            <Bar data={createChartData(errorStats, 'Số lượng lỗi')} options={chartOptions} />
                        </div>
                    </div>

                    <div className="chart-box">
                        <div className="chart-header">
                            <h3>Thống kê người dùng theo phòng</h3>
                            <button className="export-btn" onClick={() => handleExportToExcel(roomCountsUser, "Thống kê người dùng theo phòng")}>
                                Xuất Excel
                            </button>
                        </div>
                        <div className="chart">
                            <Bar data={createChartData(roomCountsUser, 'Số người dùng', 'rgba(75, 192, 192, 0.5)')} options={chartOptions} />
                        </div>
                    </div>

                    <div className="chart-box">
                        <div className="chart-header">
                            <h3>Thống kê thiết bị theo phòng</h3>
                            <button className="export-btn" onClick={() => handleExportToExcel(roomCountsDevice, "Thống kê thiết bị theo phòng")}>
                                Xuất Excel
                            </button>
                        </div>
                        <div className="chart">
                            <Bar data={createChartData(roomCountsDevice, 'Số thiết bị', 'rgba(255, 159, 64, 0.5)')} options={chartOptions} />
                        </div>
                    </div>

                    <div className="chart-box">
                        <div className="chart-header">
                            <h3>Thống kê thiết bị theo người dùng</h3>
                            <button 
                                className="export-btn" 
                                onClick={() => handleExportToExcel(userCount, "Thống kê thiết bị theo người dùng")}
                            >
                                Xuất Excel
                            </button>
                        </div>
                        <div className="chart">
                            <Bar data={createChartData(userCount, 'Số thiết bị', 'rgba(153, 102, 255, 0.5)')} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;