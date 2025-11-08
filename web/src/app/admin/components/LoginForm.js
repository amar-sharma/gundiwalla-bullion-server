'use client';
import { useState } from 'react';
import { Form, Input, Button, message, Space } from 'antd';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [form] = Form.useForm();

  const onFinish = async ({ phoneNumber }) => {
    setLoading(true);
    try {
      // Ensure the phone number is properly formatted with country code
      const formattedPhoneNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      message.success('Verification code sent!');
    } catch (error) {
      message.error('Failed to send verification code.');
      console.error(error);
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
      message.error('Invalid verification code.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="recaptcha-container"></div>
      {!verificationId ? (
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please input your phone number!' },
              { 
                pattern: /^[6-9]\d{9}$/,
                message: 'Please enter a valid 10-digit Indian mobile number!'
              }
            ]}
          >
            <Input 
              prefix="+91" 
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Send Verification Code
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Form onFinish={onVerify} layout="vertical">
          <Form.Item
            name="code"
            label="Verification Code"
            rules={[{ required: true, message: 'Please input the verification code!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Verify
            </Button>
          </Form.Item>
        </Form>
      )}
    </>
  );
};

export default LoginForm;
