'use client';
import { useState, useEffect } from 'react';
import { Form, Input, Button, App, Card, Typography } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../firebase';

const { Title, Text } = Typography;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    // Initialize reCAPTCHA verifier for phone authentication
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            console.log('reCAPTCHA expired');
          }
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }

    return () => {
      // Cleanup verifier on unmount
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const onFinish = async ({ phoneNumber }) => {
    setLoading(true);
    try {
      // Ensure the phone number is properly formatted with country code
      const formattedPhoneNumber = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber}`;

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      message.success('Verification code sent to your phone!');
    } catch (error) {
      message.error('Failed to send verification code. Please try again.');
      console.error('Phone auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async ({ code }) => {
    setLoading(true);
    try {
      const credential = await window.confirmationResult.confirm(code);
      const user = credential.user;
      message.success('Logged in successfully!');
    } catch (error) {
      message.error('Invalid verification code. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)'
    }}>
      <div id="recaptcha-container"></div>
      <Card
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.1)',
          border: '1px solid #2a2a2a'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{
            color: '#FFD700',
            marginBottom: '8px',
            fontSize: '28px',
            fontWeight: '700'
          }}>
            Admin Login
          </Title>
          <Text style={{ color: '#a6a6a6', fontSize: '14px' }}>
            {!verificationId ? 'Enter your phone number to continue' : 'Enter the verification code sent to your phone'}
          </Text>
        </div>

        {!verificationId ? (
          <Form form={form} onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="phoneNumber"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Phone Number</span>}
              rules={[
                { required: true, message: 'Please enter your phone number' },
                {
                  pattern: /^[6-9]\d{9}$/,
                  message: 'Please enter a valid 10-digit mobile number'
                }
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#FFD700' }} />}
                addonBefore="+91"
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                style={{
                  fontSize: '16px',
                  height: '48px'
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '6px'
                }}
              >
                Send Verification Code
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form onFinish={onVerify} layout="vertical" size="large">
            <Form.Item
              name="code"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Verification Code</span>}
              rules={[
                { required: true, message: 'Please enter the verification code' },
                {
                  pattern: /^\d{6}$/,
                  message: 'Verification code must be 6 digits'
                }
              ]}
            >
              <Input
                prefix={<LockOutlined style={{ color: '#FFD700' }} />}
                placeholder="Enter 6-digit code"
                maxLength={6}
                style={{
                  fontSize: '16px',
                  height: '48px',
                  letterSpacing: '4px',
                  textAlign: 'center'
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '6px'
                }}
              >
                Verify & Login
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button
                type="link"
                onClick={() => {
                  setVerificationId(null);
                  form.resetFields();
                }}
                style={{ color: '#FFD700' }}
              >
                Change Phone Number
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default LoginForm;
