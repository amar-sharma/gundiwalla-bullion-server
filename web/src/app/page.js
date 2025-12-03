'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import LoginForm from './admin/components/LoginForm';
import AdminLayout from './admin/components/AdminLayout';
import { Result, Spin, Layout, Button } from 'antd';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get custom claims from ID token
        const idTokenResult = await user.getIdTokenResult();
        console.log({ user });
        console.log({ customClaims: idTokenResult.claims });

        // Check if user has admin claim
        if (idTokenResult.claims.admin) {
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
    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={handleLogout}>
            Logout
          </Button>
        }
      />
    );
  }

  return <AdminLayout />;
};

export default HomePage;
