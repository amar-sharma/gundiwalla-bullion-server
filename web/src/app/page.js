'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoginForm from './admin/components/LoginForm';
import AdminLayout from './admin/components/AdminLayout';
import { Result, Spin, Layout } from 'antd';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Hardcode admin for your UID
        if (user.uid === 'j50cZ39iWQh9S6nwQIhCwOxrEdD2') {
          setIsAdmin(true);
        }
        setUser(user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoginForm />
      </Layout>
    );
  }

  if (!isAdmin) {
    return <Result status="403" title="403" subTitle="Sorry, you are not authorized to access this page." />;
  }

  return <AdminLayout />;
};

export default HomePage;
