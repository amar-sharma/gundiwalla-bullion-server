'use client';
import { useEffect, useState } from 'react';
import { Form, InputNumber, Button, message } from 'antd';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Default product structure with zero values
const defaultProducts = {
  "Gold": { extra: 0, percentage: 0, manual: 0 },
  "Gold RTGS": { extra: 0, percentage: 0, manual: 0 },
  "Gold Coin - 1gm": { extra: 0, percentage: 0, manual: 0 },
  "Gold Coin - 2gm": { extra: 0, percentage: 0, manual: 0 },
  "Gold Coin - 5gm": { extra: 0, percentage: 0, manual: 0 },
  "Gold Coin - 10gm": { extra: 0, percentage: 0, manual: 0 },
  "Gold Coin - 50gm": { extra: 0, percentage: 0, manual: 0 },
  "Gold Coin - 100gm": { extra: 0, percentage: 0, manual: 0 },
  "Silver": { extra: 0, percentage: 0, manual: 0 },
  "Silver RTGS": { extra: 0, percentage: 0, manual: 0 }
};

const PriceConfigForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(defaultProducts);
  
  console.log('PriceConfigForm rendered, initialData:', initialData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'rateConfig', 'charges');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge fetched data with default structure
          const mergedData = { ...defaultProducts, ...data };
          setInitialData(mergedData);
          form.setFieldsValue(mergedData);
        } else {
          // Document doesn't exist, use default structure
          setInitialData(defaultProducts);
          form.setFieldsValue(defaultProducts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // On error, still show form with default structure
        setInitialData(defaultProducts);
        form.setFieldsValue(defaultProducts);
      }
    };
    fetchData();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Clean the values to ensure no undefined fields
      const cleanedValues = {};
      Object.keys(values).forEach(productName => {
        cleanedValues[productName] = {
          extra: values[productName]?.extra ?? 0,
          percentage: values[productName]?.percentage ?? 0,
          manual: values[productName]?.manual ?? 0
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px',
              gap: '12px',
              alignItems: 'center'
            }}>
              <h4 style={{ 
                margin: 0, 
                color: '#FFD700', 
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {productName}
              </h4>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#a6a6a6', marginBottom: '4px' }}>
                  %
                </div>
                <Form.Item 
                  name={[productName, 'percentage']} 
                  style={{ margin: 0 }}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="0"
                    size="small"
                    controls={false}
                  />
                </Form.Item>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#a6a6a6', marginBottom: '4px' }}>
                  Extra
                </div>
                <Form.Item 
                  name={[productName, 'extra']} 
                  style={{ margin: 0 }}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="0"
                    size="small"
                    controls={false}
                  />
                </Form.Item>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#a6a6a6', marginBottom: '4px' }}>
                  Fixed
                </div>
                <Form.Item 
                  name={[productName, 'manual']} 
                  style={{ margin: 0 }}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    placeholder="0"
                    size="small"
                    controls={false}
                  />
                </Form.Item>
              </div>
            </div>
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
