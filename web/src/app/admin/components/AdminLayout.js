'use client';
import { Layout, Tabs, Button, message } from 'antd';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import PriceConfigForm from './PriceConfigForm';
import Orders from './Orders';
import Users from './Users';

const { Content, Header } = Layout;

const AdminLayout = () => {
  const items = [
    {
      key: 'prices',
      label: 'Set Prices',
      children: <PriceConfigForm />,
    },
    {
      key: 'orders',
      label: 'Orders',
      children: <Orders />,
    },
    {
      key: 'users',
      label: 'Users',
      children: <Users />,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      message.success('Logged out successfully');
    } catch (error) {
      message.error('Failed to log out');
      console.error(error);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Admin Dashboard</div>
        <Button type="primary" danger onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Content style={{ padding: '50px' }}>
        <Tabs defaultActiveKey="prices" items={items} />
      </Content>
    </Layout>
  );
};

export default AdminLayout;
