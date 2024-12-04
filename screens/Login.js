import React, { useState, useEffect } from 'react';
import { auth, db } from '../screens/firebaseconfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, 'USERS',email));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    navigate('/dashboard');
                } else {
                    setError('Bạn không có quyền truy cập vào trang quản trị');
                    await auth.signOut();
                }
            } else {
                setError('Không tìm thấy thông tin người dùng');
                await auth.signOut();
            }
        } catch (error) {
            setError('Đăng nhập thất bại: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <h2>Đăng Nhập Admin</h2>
                <p>Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.</p>
            </div>
            
            {error && (
                <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '10px'}}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email"
                        required
                        disabled={isLoading}
                    />
                </div>
                
                <div className="form-group">
                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu"
                        required
                        disabled={isLoading}
                    />
                </div>
                
                <button 
                    type="submit" 
                    className={`login-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
                </button>
            </form>
        </div>
    );
}

export default Login;
