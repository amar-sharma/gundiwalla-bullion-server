'use client';
import { Layout, Tabs, Empty } from 'antd';
import PriceConfigForm from './PriceConfigForm';

const { Content } = Layout;

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
      children: <Empty />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '50px' }}>
        <Tabs defaultActiveKey="prices" items={items} />
      </Content>
    </Layout>
  );
};

export default AdminLayout;
