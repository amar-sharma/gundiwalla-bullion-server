'use client';
import { useEffect, useState } from 'react';
import { Form, InputNumber, Button, message } from 'antd';
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
  const [initialData, setInitialData] = useState(defaultConfig);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'rateConfig', 'charges');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mergedData = productNames.reduce((acc, productName) => {
            acc[productName] = {
              buy: { ...defaultProductConfig.buy, ...data[productName]?.buy },
              sell: { ...defaultProductConfig.sell, ...data[productName]?.sell }
            };
            return acc;
          }, {});
          setInitialData(mergedData);
          form.setFieldsValue(mergedData);
        } else {
          setInitialData(defaultConfig);
          form.setFieldsValue(defaultConfig);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setInitialData(defaultConfig);
        form.setFieldsValue(defaultConfig);
      }
    };
    fetchData();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const cleanedValues = {};
      Object.keys(values).forEach(productName => {
        cleanedValues[productName] = {
          buy: {
            extra: values[productName]?.buy?.extra ?? 0,
            percentage: values[productName]?.buy?.percentage ?? 0,
            manual: values[productName]?.buy?.manual ?? 0
          },
          sell: {
            extra: values[productName]?.sell?.extra ?? 0,
            percentage: values[productName]?.sell?.percentage ?? 0,
            manual: values[productName]?.sell?.manual ?? 0
          }
        };
      });

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
      gridTemplateColumns: '60px 1fr 1fr 1fr',
      gap: '12px',
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
      gridTemplateColumns: '60px 1fr 1fr 1fr',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '8px'
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

  return (
    <Form form={form} onFinish={onFinish} layout="vertical" size="small">
      <div style={{ display: 'grid', gap: '12px' }}>
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

