'use client';
import { useEffect, useState } from 'react';
import { Form, InputNumber, Button, App, Spin } from 'antd';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Default product structure with zero values
const defaultProductConfig = {
  buy: { extra: 0, percentage: 0, manual: 0 },
  sell: { extra: 0, percentage: 0, manual: 0 }
};

const productNames = [
  "Gold",
  "Gold RTGS",
  "Gold (995)",
  "Gold RTGS (995)",
  "Gold Coin - 1gm",
  "Gold Coin - 2gm",
  "Gold Coin - 5gm",
  "Gold Coin - 10gm",
  "Gold Coin - 50gm",
  "Gold Coin - 100gm",
  "Silver",
  "Silver RTGS"
];

const defaultConfig = productNames.reduce((acc, productName) => {
  acc[productName] = defaultProductConfig;
  return acc;
}, {});

const PriceConfigForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialData, setInitialData] = useState(defaultConfig);
  const { message } = App.useApp();

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const docRef = doc(db, 'rateConfig', 'charges');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched data from Firestore:', data);

          // Transform data from {buy: {productName: config}, sell: {productName: config}}
          // to {productName: {buy: config, sell: config}}
          const mergedData = productNames.reduce((acc, productName) => {
            acc[productName] = {
              buy: {
                ...defaultProductConfig.buy,
                ...(data.buy?.[productName] || {})
              },
              sell: {
                ...defaultProductConfig.sell,
                ...(data.sell?.[productName] || {})
              }
            };
            return acc;
          }, {});

          console.log('Transformed data for form:', mergedData);
          setInitialData(mergedData);
          form.setFieldsValue(mergedData);
        } else {
          setInitialData(defaultConfig);
          form.setFieldsValue(defaultConfig);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load configuration. Using default values.');
        setInitialData(defaultConfig);
        form.setFieldsValue(defaultConfig);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Transform data from {productName: {buy: config, sell: config}}
      // to {buy: {productName: config}, sell: {productName: config}}
      const cleanedValues = {
        buy: {},
        sell: {}
      };

      Object.keys(values).forEach(productName => {
        cleanedValues.buy[productName] = {
          extra: values[productName]?.buy?.extra ?? 0,
          percentage: values[productName]?.buy?.percentage ?? 0,
          manual: values[productName]?.buy?.manual ?? 0
        };
        cleanedValues.sell[productName] = {
          extra: values[productName]?.sell?.extra ?? 0,
          percentage: values[productName]?.sell?.percentage ?? 0,
          manual: values[productName]?.sell?.manual ?? 0
        };
      });

      console.log('Saving to Firestore:', cleanedValues);
      await setDoc(doc(db, 'rateConfig', 'charges'), cleanedValues, { merge: true });
      message.success('Prices updated successfully!');
    } catch (error) {
      message.error('Update failed. Please try again.');
      console.error('Error updating prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '70px repeat(3, 1fr)',
      gap: '8px',
      alignItems: 'center',
      marginBottom: '8px',
      color: '#a6a6a6',
      fontSize: '11px'
    }}>
      <span></span>
      <span style={{ textAlign: 'center' }}>%</span>
      <span style={{ textAlign: 'center' }}>Extra</span>
      <span style={{ textAlign: 'center' }}>Fixed</span>
    </div>
  );

  const renderFormRow = (productName, type) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '70px repeat(3, 1fr)',
      gap: '8px',
      alignItems: 'center',
      marginBottom: '8px',
      width: '100%',
      minWidth: '280px'
    }}>
      <span style={{ color: type === 'buy' ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
      <Form.Item name={[productName, type, 'percentage']} style={{ margin: 0 }}>
        <InputNumber style={{ width: '100%' }} placeholder="%" size="small" controls={false} />
      </Form.Item>
      <Form.Item name={[productName, type, 'extra']} style={{ margin: 0 }}>
        <InputNumber style={{ width: '100%' }} placeholder="Extra" size="small" controls={false} />
      </Form.Item>
      <Form.Item name={[productName, type, 'manual']} style={{ margin: 0 }}>
        <InputNumber style={{ width: '100%' }} placeholder="Fixed" size="small" controls={false} />
      </Form.Item>
    </div>
  );

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading configuration..." />
      </div>
    );
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical" size="small" initialValues={initialData}>
      <div style={{ display: 'flex', gap: '12px', flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.keys(initialData).map((productName) => (
          <div
            key={productName}
            style={{
              padding: '12px',
              border: '1px solid #434343',
              borderRadius: '6px',
              backgroundColor: '#1f1f1f'
            }}
          >
            <h4 style={{
              margin: '0 0 12px 0',
              color: '#FFD700',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {productName}
            </h4>
            {renderHeader()}
            {renderFormRow(productName, 'buy')}
            {renderFormRow(productName, 'sell')}
          </div>
        ))}
      </div>

      <div style={{
        position: 'sticky',
        bottom: '0',
        backgroundColor: '#141414',
        padding: '16px 0',
        textAlign: 'center',
        marginTop: '20px'
      }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          style={{
            height: '44px',
            fontSize: '16px',
            fontWeight: '600',
            minWidth: '160px'
          }}
        >
          Save Prices
        </Button>
      </div>
    </Form>
  );
};

export default PriceConfigForm;

