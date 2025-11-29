'use client';
import { useState, useEffect } from 'react';
import { Table, Button, Form, Input, message, Card, Row, Col, Alert, Popconfirm } from 'antd';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

const Users = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [form] = Form.useForm();
	const [registering, setRegistering] = useState(false);
	const [error, setError] = useState(null);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const getUsers = httpsCallable(functions, 'getUsers');
			const result = await getUsers();
			setUsers(result.data);
		} catch (error) {
			console.error("Error fetching users:", error);
			message.error("Failed to fetch users");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleRegister = async (values) => {
		setRegistering(true);
		setError(null);
		try {
			const createUser = httpsCallable(functions, 'createUser');
			await createUser({
				displayName: values.name,
				phoneNumber: `+91${values.phoneNumber}`,
			});
			message.success("User registered successfully");
			form.resetFields();
			fetchUsers(); // Refresh the list
		} catch (error) {
			console.error("Error registering user:", error);
			const errorMessage = error.message?.replace('internal: ', '') || "Failed to register user";
			setError(errorMessage);
			message.error(errorMessage);
		} finally {
			setRegistering(false);
		}
	};

	const handleDelete = async (uid) => {
		try {
			const deleteUser = httpsCallable(functions, 'deleteUser');
			await deleteUser({ uid });
			message.success("User deleted successfully");
			fetchUsers();
		} catch (error) {
			console.error("Error deleting user:", error);
			const errorMessage = error.message?.replace('internal: ', '') || "Failed to delete user";
			message.error(errorMessage);
		}
	};

	const columns = [
		{
			title: 'Name',
			dataIndex: 'displayName',
			key: 'displayName',
		},
		{
			title: 'Phone Number',
			dataIndex: 'phoneNumber',
			key: 'phoneNumber',
		},
		{
			title: 'UID',
			dataIndex: 'uid',
			key: 'uid',
		},
		{
			title: 'Created At',
			dataIndex: ['metadata', 'creationTime'],
			key: 'creationTime',
			render: (text) => new Date(text).toLocaleString(),
		},
		{
			title: 'Action',
			key: 'action',
			render: (_, record) => (
				<Popconfirm
					title="Delete User"
					description="Are you sure to delete this user?"
					onConfirm={() => handleDelete(record.uid)}
					okText="Yes"
					cancelText="No"
				>
					<Button danger size="small">Delete</Button>
				</Popconfirm>
			),
		},
	];

	return (
		<div>
			<Card title="Register New User" style={{ marginBottom: 20 }}>
				{error && (
					<div style={{ marginBottom: 16 }}>
						<Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
					</div>
				)}
				<Form form={form} onFinish={handleRegister} layout="vertical">
					<Row gutter={16}>
						<Col xs={24} sm={12} md={8}>
							<Form.Item
								name="name"
								rules={[{ required: true, message: 'Please input the name!' }]}
							>
								<Input placeholder="Name" />
							</Form.Item>
						</Col>
						<Col xs={24} sm={12} md={8}>
							<Form.Item
								name="phoneNumber"
								rules={[{ required: true, message: 'Please input the phone number!' }]}
							>
								<Input placeholder="Phone Number (+91...)" />
							</Form.Item>
						</Col>
						<Col xs={24} sm={12} md={8}>
							<Form.Item>
								<Button type="primary" htmlType="submit" loading={registering} block>
									Register User
								</Button>
							</Form.Item>
						</Col>
					</Row>
				</Form>
			</Card>

			<Table
				columns={columns}
				dataSource={users}
				rowKey="uid"
				loading={loading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: true }}
			/>
		</div>
	);
};

export default Users;
