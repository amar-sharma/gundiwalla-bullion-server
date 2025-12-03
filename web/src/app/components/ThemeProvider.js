'use client';
import { ConfigProvider, theme, App } from 'antd';

const ThemeProvider = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#FFD700', // Gold color
          colorInfo: '#FFD700',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorBgBase: '#141414', // Dark background
          colorBgContainer: '#1f1f1f', // Container background
          colorBorder: '#434343',
          colorText: '#ffffff',
          colorTextSecondary: '#a6a6a6',
          borderRadius: 6,
          fontSize: 14,
        },
        components: {
          Button: {
            primaryColor: '#000000',
            colorPrimary: '#FFD700',
            colorPrimaryHover: '#FFC000',
            colorPrimaryActive: '#E6C200',
            colorPrimaryBorder: '#FFD700',
          },
          Input: {
            colorBgContainer: '#262626',
            colorBorder: '#434343',
            colorText: '#ffffff',
          },
          Form: {
            labelColor: '#ffffff',
            colorText: '#ffffff',
          },
          Layout: {
            bodyBg: '#141414',
            headerBg: '#1f1f1f',
            footerBg: '#1f1f1f',
          },
          Tabs: {
            colorText: '#ffffff',
            colorBgContainer: '#1f1f1f',
          },
          Collapse: {
            colorBgContainer: '#262626',
            colorText: '#ffffff',
            headerBg: '#1f1f1f',
          }
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
};

export default ThemeProvider;