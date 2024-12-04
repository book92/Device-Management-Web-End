import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Customer from './screens/Customer';
import Device from './screens/Device';
import Error from './screens/Error';
import Settings from './screens/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/device" element={<Device />} />
        <Route path="/error" element={<Error />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
